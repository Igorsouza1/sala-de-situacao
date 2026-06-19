# Plano: Solidificar Tenant→Região e Dados de Base (FIRMS, Propriedades, Desmatamento)

**Contexto:** ver ADR 0007 (regiao→tenant FK) e ADR 0008 (dados de base sem tenant).  
**Objetivo:** tornar o sistema de alertas FIRMS funcional e o modelo de multi-tenancy coerente.  
**Estratégia:** migração gradual — add nova estrutura → migra código → remove colunas antigas. Produção nunca quebra entre fases.

---

## Fase 1 — `regioes.tenant_id` como FK real

**Por que primeiro:** todas as fases seguintes dependem de `regioes.tenant_id` para que as queries de acesso funcionem após remover `tenant_id` dos Dados de Base.

### 1.1 Migration SQL (nova: `0008_regiao_tenant_fk.sql`)

```sql
-- Adiciona coluna nullable
ALTER TABLE monitoramento.regioes
  ADD COLUMN IF NOT EXISTS tenant_id UUID
    REFERENCES monitoramento.tenants(id) ON DELETE RESTRICT;

-- Popula a partir do metadata existente
UPDATE monitoramento.regioes
SET tenant_id = (metadata->>'organizationId')::uuid
WHERE tenant_id IS NULL
  AND metadata->>'organizationId' IS NOT NULL;

-- Aplica NOT NULL após população
ALTER TABLE monitoramento.regioes
  ALTER COLUMN tenant_id SET NOT NULL;

-- Índice para lookup tenant → regiões
CREATE INDEX idx_regioes_tenant
  ON monitoramento.regioes(tenant_id);
```

### 1.2 Arquivos de código a atualizar

| Arquivo | O que muda |
|---|---|
| `db/schema.ts` | Adiciona `tenantId uuid().notNull()` em `regioesInMonitoramento` com FK |
| `lib/repositories/adminRepository.ts` | `listRegionsInDb`, `getRegionByIdInDb`: remover `metadata->>'organizationId'` do SELECT, usar coluna `tenant_id` diretamente |
| `lib/repositories/adminRepository.ts` | `createRegionInDb`: inserir `tenant_id` como coluna, não no `jsonb_build_object` |
| `lib/repositories/adminRepository.ts` | `updateRegionInDb`, `updateRegionInfoInDb`, `updateRegionMetadataInDb`: idem |
| `app/api/map/layers/route.ts` | Substituir `SELECT metadata->>'organizationId'` por `SELECT tenant_id FROM regioes WHERE id = ?` |
| `app/api/admin/regions/[id]/commit-focos/route.ts` | Substituir `metadata->>'organizationId'` por `tenant_id` |
| `app/api/admin/regions/[id]/commit-properties/route.ts` | Idem |
| `app/api/admin/regions/[id]/commit-desmatamento/route.ts` | Idem |

### 1.3 Verificação

- [ ] Criar região nova → `tenant_id` salvo como coluna
- [ ] Editar região → `tenant_id` atualizado
- [ ] Mapa carrega layers corretamente para o tenant
- [ ] `metadata->>'organizationId'` ainda existe (não remover ainda — pode ter outros consumidores)

---

## Fase 2 — FIRMS multi-região

**Depende de:** Fase 1 concluída.

### 2.1 Migration SQL (já escrita: `0007_firms_junction_multi_tenant.sql`)

Aplicar no banco. Ela já:
- Cria `firms_regioes(firm_id, regiao_id, alerta_enviado, notified_at)`
- Migra dados existentes
- Remove `tenant_id`, `regiao_id`, `alerta_enviado` de `raw_firms`

> **Atenção:** aplicar SOMENTE após o código da Fase 2 estar deployado — a migration remove colunas que o código atual ainda usa.

### 2.2 `db/schema.ts`

```typescript
// Adicionar nova tabela
export const firmsRegioesInMonitoramento = monitoramento.table("firms_regioes", {
  id:            uuid().defaultRandom().primaryKey().notNull(),
  firmId:        uuid("firm_id").notNull().references(() => rawFirmsInMonitoramento.id, { onDelete: "cascade" }),
  regiaoId:      integer("regiao_id").notNull().references(() => regioesInMonitoramento.id, { onDelete: "cascade" }),
  alertaEnviado: boolean("alerta_enviado").notNull().default(false),
  notifiedAt:    timestamp("notified_at", { withTimezone: true, mode: 'string' }),
  createdAt:     timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
  unique("firms_regioes_firm_regiao_unique").on(table.firmId, table.regiaoId),
  index("idx_firms_regioes_pendentes").on(table.regiaoId, table.firmId), // partial WHERE alerta_enviado=false — só via SQL raw
  index("idx_firms_regioes_firm").on(table.firmId),
]);

// Remover de rawFirmsInMonitoramento: regiaoId, alertaEnviado, tenantId
```

### 2.3 `lib/repositories/firmsRepository.ts`

**Remover:**
- `getUnnotifiedFirms()` — lê `alertaEnviado` diretamente em `raw_firms`
- `markFirmsAsNotified()` — escreve `alertaEnviado` em `raw_firms`
- `getActiveRegions()` — ok, mas verificar

**Adicionar:**
```typescript
// Busca pares (firm, regiao) ainda não notificados
async getUnnotifiedFirmsRegioes(): Promise<{ firmId, regiaoId, firm... }[]>
  // SELECT fr.firm_id, fr.regiao_id, rf.*
  // FROM firms_regioes fr JOIN raw_firms rf ON rf.id = fr.firm_id
  // WHERE fr.alerta_enviado = false

// Marca como notificado por (firm_id, regiao_id)
async markFirmsRegioesAsNotified(ids: string[]): Promise<void>
  // UPDATE firms_regioes SET alerta_enviado=true, notified_at=now() WHERE id IN (...)

// Bulk insert na junction (após inserir o firm em raw_firms)
async bulkInsertFirmsRegioes(entries: { firmId, regiaoId }[]): Promise<void>
```

**Atualizar `findAllFirmsDataWithGeometry`:**
```typescript
// Antes: WHERE tenant_id = $tenantId
// Depois: JOIN firms_regioes fr ON fr.firm_id = rf.id WHERE fr.regiao_id = $regiaoId
```

### 2.4 `lib/service/firmsService.ts`

**`processCSVData`:**
- Remover `break` — continuar iterando para encontrar TODAS as regiões que contêm o ponto
- Retornar `{ firm: RawFirmInsert, regiaoIds: number[] }[]` (não mais 1 firm por região)

**`syncFirmsData`:**
- Inserir firm em `raw_firms` (dedup por unique index lat/lon/date/time)
- Para cada firm inserido (ou já existente), inserir entradas em `firms_regioes` para cada `regiaoId` correspondente
- Usar `ON CONFLICT DO NOTHING` na junction

**`notifyFirms`:**
- Usar `getUnnotifiedFirmsRegioes()` em vez de `getUnnotifiedFirms()`
- Lógica de agrupamento e envio permanece igual (agrupar por `regiaoId`)
- Marcar com `markFirmsRegioesAsNotified()` por ID da linha da junction

### 2.5 `lib/service/layer-resolver.ts` e `lib/repositories/firmsRepository.ts`

- `TABLE_DISPLAY_COLUMNS['raw_firms']`: remover `tenant_id` da lista de colunas
- `findAllFirmsDataWithGeometry`: filtrar por `regiao_id` via `firms_regioes` (não mais `tenant_id`)

### 2.6 Verificação

- [ ] Sync roda e insere focos em múltiplas regiões quando ponto está em sobreposição
- [ ] Notificação envia email para destinatários de CADA região afetada
- [ ] Mapa exibe focos corretamente filtrados por `regiao_id`
- [ ] Importação manual de focos via `/admin/regions/[id]/commit-focos` ainda funciona

---

## Fase 3 — Propriedades multi-região

**Depende de:** Fase 1 concluída. Independente da Fase 2.

### 3.1 Migration SQL (nova: `0009_propriedades_junction.sql`)

```sql
-- Junction table
CREATE TABLE monitoramento.propriedades_regioes (
  id             UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  propriedade_id INT  NOT NULL REFERENCES monitoramento.propriedades(id) ON DELETE CASCADE,
  regiao_id      INT  NOT NULL REFERENCES monitoramento.regioes(id) ON DELETE CASCADE,
  UNIQUE (propriedade_id, regiao_id)
);

CREATE INDEX idx_propriedades_regioes_regiao
  ON monitoramento.propriedades_regioes(regiao_id);

-- Migrar dados existentes
INSERT INTO monitoramento.propriedades_regioes (propriedade_id, regiao_id)
SELECT id, regiao_id FROM monitoramento.propriedades
WHERE regiao_id IS NOT NULL
ON CONFLICT DO NOTHING;
```

**Segunda migration (após código atualizado):**
```sql
ALTER TABLE monitoramento.propriedades
  DROP COLUMN IF EXISTS regiao_id,
  DROP COLUMN IF EXISTS tenant_id;
```

### 3.2 Arquivos a atualizar

| Arquivo | O que muda |
|---|---|
| `db/schema.ts` | Adicionar `propriedadesRegioesInMonitoramento`; remover `regiaoId` e `tenantId` de `propriedadesInMonitoramento` |
| `lib/repositories/propriedadesRepository.ts` | `findAllPropriedadesDataWithGeometry`: filtrar por `regiao_id` via junction em vez de `tenant_id` |
| `lib/service/layer-resolver.ts` | `TABLE_DISPLAY_COLUMNS['propriedades']`: remover `tenant_id` |
| `app/api/admin/regions/[id]/commit-properties/route.ts` | Inserção: após upsert da propriedade, inserir em `propriedades_regioes` |

### 3.3 Verificação

- [ ] Propriedade em área de sobreposição aparece nas duas regiões
- [ ] Dossiê de propriedade carrega corretamente
- [ ] Importação via admin continua funcionando

---

## Fase 4 — Desmatamento multi-região

**Depende de:** Fase 1 concluída. Independente das Fases 2 e 3.

### 4.1 Migration SQL (nova: `0010_desmatamento_junction.sql`)

Mesmo padrão da Fase 3:
- Criar `desmatamento_regioes(id, desmatamento_id, regiao_id)` com unique constraint
- Migrar dados de `desmatamento.regiao_id`
- Segunda migration: drop `regiao_id` e `tenant_id` de `desmatamento`

### 4.2 Arquivos a atualizar

| Arquivo | O que muda |
|---|---|
| `db/schema.ts` | Adicionar `desmatamentoRegioesInMonitoramento`; remover `regiaoId` e `tenantId` de `desmatamentoInMonitoramento` |
| `lib/repositories/desmatamentoReposiroty.ts` | Filtrar por `regiao_id` via junction |
| `lib/service/layer-resolver.ts` | `TABLE_DISPLAY_COLUMNS['desmatamento']`: remover `tenant_id` |
| `app/api/admin/regions/[id]/commit-desmatamento/route.ts` | Inserção: após upsert, inserir em `desmatamento_regioes` |

### 4.3 Verificação

- [ ] Detecção de desmatamento em sobreposição aparece nas duas regiões
- [ ] Notificação de desmatamento (se houver) funciona por região
- [ ] Importação via admin continua funcionando

---

## Limpeza final (após todas as fases)

- Remover `metadata->>'organizationId'` de queries que ainda o usam (depois que `tenant_id` em `regioes` for a única fonte de verdade)
- Remover padrão `tenantId ?? process.env.SEED_TENANT_ID` dos repositórios de Dados de Base (já não usam tenant_id)
- Atualizar `db/migrations/relations.ts` para refletir novo schema

---

## Ordem de execução recomendada

```
Fase 1 (regioes.tenant_id)
  ↓
Fase 2 (FIRMS)   Fase 3 (Propriedades)   Fase 4 (Desmatamento)
     ↓                    ↓                        ↓
                   Limpeza final
```

Fases 2, 3 e 4 são independentes entre si — podem ser feitas em paralelo ou na ordem que fizer mais sentido operacionalmente. Fase 1 é pré-requisito de todas.
