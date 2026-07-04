# Plano: Solidificar Tenant→Região e Dados de Base (FIRMS, Propriedades, Desmatamento)

**Contexto:** ver ADR 0007 (regiao→organization_id FK), ADR 0008 (dados de base sem tenant) e ADR 0009 (ingestão FIRMS como Supabase Edge Function).  
**Objetivo:** tornar o sistema de alertas FIRMS funcional e o modelo de multi-tenancy coerente.  
**Estratégia:** migração gradual — add nova estrutura → migra código → remove colunas antigas. Produção nunca quebra entre fases.

---

## Fase 1 — `regioes.organization_id` como FK real

**Por que primeiro:** todas as fases seguintes dependem de `regioes.organization_id` para que as queries de acesso funcionem após remover `tenant_id`/`organization_id` dos Dados de Base.

**Estado real observado em produção (2026-07-01):** alguém já começou esta fase manualmente, fora do fluxo de migrations. A coluna `monitoramento.regioes.organization_id UUID` **já existe**, já tem `FOREIGN KEY (organization_id) REFERENCES monitoramento.tenants(id)`, e já está **totalmente populada** (as 2 regiões atuais têm o valor correto, migrado do `metadata->>'organizationId'`). Falta apenas: `NOT NULL`, índice, refletir no `db/schema.ts` (que hoje não conhece essa coluna) e trocar os call sites.

**Nome da coluna:** o nome real em produção é `organization_id`, não `tenant_id` como este documento sugeria originalmente. Decisão: **manter `organization_id`** (ver ADR 0007, corrigida) — não renomear para `tenant_id`, mesmo que isso deixe uma inconsistência de nomenclatura com `acoes.tenant_id`/`raw_firms.tenant_id`. Renomear uma coluna já populada em produção não tem ganho funcional suficiente para justificar o risco.

**Escopo desta sessão:** como o foco atual é exclusivamente FIRMS, os call sites atualizados agora são só os que o fluxo de FIRMS toca: `adminRepository.ts` (CRUD de região), `app/api/map/layers/route.ts` e `commit-focos/route.ts`. `commit-properties/route.ts` e `commit-desmatamento/route.ts` continuam lendo `metadata->>'organizationId'` por ora — fazem parte do escopo de Fase 3/4, não quebram nada continuando assim.

### 1.1 Migration SQL (nova: `0008_regiao_organization_id_fk.sql`)

Idempotente — cobre tanto produção (coluna já existe, só falta NOT NULL/índice) quanto um ambiente novo do zero.

```sql
-- Adiciona a coluna se não existir (produção já tem; outros ambientes não)
ALTER TABLE monitoramento.regioes
  ADD COLUMN IF NOT EXISTS organization_id UUID
    REFERENCES monitoramento.tenants(id) ON DELETE RESTRICT;

-- Popula a partir do metadata existente, só onde ainda estiver nulo
UPDATE monitoramento.regioes
SET organization_id = (metadata->>'organizationId')::uuid
WHERE organization_id IS NULL
  AND metadata->>'organizationId' IS NOT NULL;

-- Aplica NOT NULL após população
ALTER TABLE monitoramento.regioes
  ALTER COLUMN organization_id SET NOT NULL;

-- Índice para lookup organização → regiões
CREATE INDEX IF NOT EXISTS idx_regioes_organization
  ON monitoramento.regioes(organization_id);
```

### 1.2 Arquivos de código a atualizar (escopo FIRMS)

| Arquivo | O que muda |
|---|---|
| `db/schema.ts` | Adiciona `organizationId: uuid("organization_id").notNull()` em `regioesInMonitoramento` com FK — coluna não existia no schema apesar de já existir no banco |
| `lib/repositories/adminRepository.ts` | `listRegionsInDb`, `getRegionByIdInDb`: remover `metadata->>'organizationId'` do SELECT, usar coluna `organization_id` diretamente |
| `lib/repositories/adminRepository.ts` | `createRegionInDb`: inserir `organization_id` como coluna, não no `jsonb_build_object` |
| `lib/repositories/adminRepository.ts` | `updateRegionInDb`, `updateRegionInfoInDb`, `updateRegionMetadataInDb`: idem |
| `app/api/map/layers/route.ts` | Substituir `SELECT metadata->>'organizationId'` por `SELECT organization_id FROM regioes WHERE id = ?` |
| `app/api/admin/regions/[id]/commit-focos/route.ts` | Substituir `metadata->>'organizationId'` por `organization_id` (ver também Fase 2.6 — este arquivo tem mudanças adicionais) |

**Fora de escopo por ora (não quebram, ficam para Fase 3/4):** `app/api/admin/regions/[id]/commit-properties/route.ts`, `app/api/admin/regions/[id]/commit-desmatamento/route.ts`, e os demais ~18 consumidores de `metadata->>'organizationId'` espalhados pelo código (`organizationRepository.ts`, `adminService.ts`, componentes admin, etc.).

### 1.3 Verificação

- [ ] `organization_id` com `NOT NULL` e índice aplicados sem erro (já populado, não deve haver linhas nulas)
- [ ] Criar região nova → `organization_id` salvo como coluna
- [ ] Editar região → `organization_id` atualizado
- [ ] Mapa carrega layers corretamente para a organização
- [ ] `metadata->>'organizationId'` ainda existe (não remover ainda — outros consumidores fora de escopo desta sessão)

---

## Fase 2 — FIRMS multi-região

**Depende de:** Fase 1 concluída.

**Decisões de arquitetura desta sessão (ver ADR 0009):**
- A automação de ingestão atual (`app/api/cron/firms-sync`, `app/api/cron/firms-notify`, e as classes `FirmsFetcher`/`FirmsProcessor`/`FirmsNotifier` em `lib/service/firmsService.ts`) **nunca rodou em produção** — não existe `vercel.json` com `crons` configurado. É código morto: **deletar, não portar.**
- A ingestão é reconstruída do zero como duas **Supabase Edge Functions standalone** (`supabase/functions/firms-sync`, `supabase/functions/firms-notify`) — Deno, sem importar `db/schema.ts` nem `lib/repositories/` do Next.js. Cada uma com seu próprio cliente Postgres (`postgres` via `npm:`).
- Disparo via **`pg_cron` + `pg_net`**, 1x/dia.
- Notificação por email via **Resend** (domínio já verificado) — Microsoft Graph/Outlook é removido por completo (descontinuado).
- O match ponto-região é feito em **SQL/PostGIS** (`ST_Intersects` contra `regioes.geom`, que já tem índice GiST via staging table), não em JS/turf — isso resolve "múltiplas regiões sobrepostas" de graça (JOIN retorna todos os matches; sem `break`, sem loop manual).

### 2.1 Migration SQL (já escrita: `0007_firms_junction_multi_tenant.sql`)

Aplicar no banco. Ela já:
- Cria `firms_regioes(firm_id, regiao_id, alerta_enviado, notified_at)`
- Migra dados existentes
- Remove `tenant_id`, `regiao_id`, `alerta_enviado` de `raw_firms`

> **Atenção:** aplicar SOMENTE após o código da Fase 2 estar deployado (Edge Functions + `commit-focos` atualizado) — a migration remove colunas que código hoje em produção ainda usa (`layer-resolver.ts` via `TABLE_DISPLAY_COLUMNS`, `commit-focos/route.ts`).

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

### 2.3 Novo: `supabase/functions/firms-sync/index.ts` (standalone, Deno)

Pipeline, tudo via `postgres` (npm:) e SQL cru:

1. Fetch do CSV do dia na API do FIRMS (mesma lógica de hoje: `VIIRS_NOAA20_NRT/world/1/<data>`).
2. Parse do CSV, insere as linhas cruas numa **temp table de staging** dentro da mesma transação (sem pré-filtro em JS além de um bbox numérico barato, se necessário para reduzir volume antes de tocar o banco).
3. Uma query resolve, via `ST_Intersects(staging.geom, regioes.geom)`, quais linhas caem em pelo menos uma região.
4. `INSERT INTO raw_firms (...) SELECT ... FROM staging WHERE <match> ON CONFLICT (lat, lon, acq_date, acq_time) DO UPDATE SET acq_date = EXCLUDED.acq_date RETURNING id, latitude, longitude, acq_date, acq_time` — o `DO UPDATE` no-op (reescreve a mesma coluna) é necessário pra sempre obter o `id`, mesmo quando o foco já existia (`DO NOTHING` não devolve linha em caso de conflito, e o `id` é indispensável pro passo seguinte).
5. `INSERT INTO firms_regioes (firm_id, regiao_id) SELECT rf.id, r.id FROM <resultado do passo 4> rf JOIN regioes r ON ST_Intersects(rf.geom, r.geom) ON CONFLICT (firm_id, regiao_id) DO NOTHING` — cobre tanto focos novos quanto focos que já existiam mas ainda não tinham o link para esta região.
6. Enriquecimento CAR: mesma lógica de hoje (`UPDATE raw_firms SET cod_imovel = ... FROM propriedades WHERE ST_Intersects(...) AND cod_imovel IS NULL`), portada para o cliente `postgres` da Edge Function.

### 2.4 Novo: `supabase/functions/firms-notify/index.ts` (standalone, Deno)

1. `SELECT fr.id, fr.firm_id, fr.regiao_id, rf.* FROM firms_regioes fr JOIN raw_firms rf ON rf.id = fr.firm_id WHERE fr.alerta_enviado = false` — usa o índice parcial já criado na migration 0007.
2. Agrupa por `regiao_id`, busca `destinatarios_alertas` ativos com `preferencias.fogo = true` por região (schema já pronto, sem mudanças).
3. Envia email via Resend (um envio por região, mesmo corpo/formato de hoje).
4. `UPDATE firms_regioes SET alerta_enviado = true, notified_at = now() WHERE id = ANY($idsDaJunction)`.

### 2.5 `lib/service/layer-resolver.ts`

- `TABLE_DISPLAY_COLUMNS['raw_firms']`: remover `tenant_id` da lista de colunas. O `layer_catalog` do slug `raw_firms` já está com `scope: 'region'` (confirmado em produção) — a query de exibição já filtra por `ST_Intersects(geom, região)` e não depende de `firms_regioes` para o mapa funcionar. Nenhuma outra mudança necessária neste arquivo.

### 2.6 `app/api/admin/regions/[id]/commit-focos/route.ts` — ajuste mínimo obrigatório

Este arquivo escreve hoje diretamente em `regiao_id`, `alerta_enviado`, `tenant_id` de `raw_firms` — colunas que a migration 0007 remove. Sem ajuste, quebra assim que a migration for aplicada.

**Mudança mínima nesta sessão** (o resto fica como dívida técnica, ver abaixo):
- Trocar `metadata->>'organizationId'` por `organization_id` (Fase 1).
- Remover `regiaoId`, `alertaEnviado`, `tenantId` do `INSERT` em `raw_firms`.
- Para cada linha **inserida com sucesso**, inserir também em `firms_regioes(firm_id, regiao_id)`.

**Dívida técnica registrada, não corrigida agora — issue #41:** quando a checagem de duplicata (linhas 96-105 do arquivo atual) encontra um foco que já existe, o código hoje só incrementa `skippedCount` e segue — **nunca cria o link em `firms_regioes` para a região atual**. Isso é relevante justamente no caso de onboarding de uma nova Região cujo histórico se sobrepõe a dados já importados por outra Região: o foco existente nunca aparece pra Região nova. Correção (fora do escopo desta sessão, ver issue #41): ao encontrar duplicata, ainda assim `INSERT INTO firms_regioes (firm_id, regiao_id) VALUES (<id do duplicate check>, regionId) ON CONFLICT DO NOTHING`.

### 2.7 Limpeza de código morto

Confirmado (call-chain completo rastreado) que os itens abaixo são inalcançáveis a partir de qualquer rota em produção — `layerService.ts` sempre prefere Caminho R (`resolveTableLayer`) pra `raw_firms` porque seu `schema_config.sourceType === 'table'`, e `requireAuthWithTenant()` garante `tenantId` sempre truthy antes de chegar no router:

- `app/api/mapLayers/route.ts` (base route — substituída por `/api/map/layers`; `/api/mapLayers/regioes` e `/api/mapLayers/upload` continuam vivas e não são afetadas)
- `lib/service/mapLayerService.ts`
- `lib/repositories/mapLayerRepository.ts`
- `lib/repositories/firmsRepository.ts` → função `findAllFirmsDataWithGeometry`
- `lib/service/layerService.ts` → entrada `STATIC_STRATEGIES['raw_firms']`
- `lib/service/firmsService.ts` (arquivo inteiro — lógica reconstruída nas Edge Functions, ver 2.3/2.4)
- `app/api/cron/firms-sync/route.ts`, `app/api/cron/firms-notify/route.ts`

### 2.8 Verificação

- [ ] `firms-sync` roda e insere focos em múltiplas regiões quando ponto está em sobreposição (via `ST_Intersects`, sem `break`)
- [ ] `firms-sync` cria o link em `firms_regioes` mesmo quando o foco já existia em `raw_firms` (upsert com `RETURNING id`)
- [ ] `firms-notify` envia email via Resend para destinatários de CADA região afetada, e marca `alerta_enviado` só na linha da junction correspondente
- [ ] Mapa exibe focos corretamente (via `layer-resolver.ts`, scope `region`, sem `tenant_id` no SELECT)
- [ ] Importação manual de focos via `/admin/regions/[id]/commit-focos` ainda funciona, sem escrever em colunas removidas
- [ ] `pg_cron` dispara `firms-sync` e `firms-notify` 1x/dia sem intervenção manual

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
