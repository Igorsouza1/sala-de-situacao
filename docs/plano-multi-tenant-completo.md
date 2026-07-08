# Plano: Multi-tenant completo — fases além de FIRMS/Propriedades/Desmatamento

**Contexto:** continuação de `docs/plano-dados-de-base-e-firms.md` (Fases 1–4, que permanecem intactas). Decisões desta sessão registradas em ADR 0008 (escopo ampliado) e ADR 0010 (isolamento app-layer).
**Objetivo:** PRISMA operando como sistema multi-tenant robusto — várias organizações e regiões, onboarding sem SQL manual, isolamento garantido.
**Estratégia:** mesma das Fases 1–4 — expand → migrate → contract; produção nunca quebra entre fases.

## Taxonomia decidida (referência rápida)

| Categoria | Entidades | Modelo |
|---|---|---|
| Dado de Base (compartilhado) | `raw_firms`, `propriedades`, `desmatamento`, `estradas`, `javali_avistamentos` | Sem `tenant_id`; junction `*_regioes` via `ST_Intersects`; exibição filtra por `regiao_id` |
| Dado do Tenant (privado) | `acoes`, `fotos_acoes`, `trilhas`, `waypoints`, camadas custom (`layer_catalog`/`layer_data`) | `tenant_id NOT NULL` + `regiao_id`; Org B nunca vê |
| Legado congelado | `deque_de_pedras`, `balneario_municipal`, `ponte_do_cure` | Intocadas, só tenant seed; modelo genérico (ADR 0004) é projeto futuro |
| Infra de acesso | `tenants`, `roles`, `regioes.organization_id`, `destinatarios_alertas` | `roles` primário; `user_access` deprecada (Fase 8) |

**Alertas:** só FIRMS agora. Desmatamento automatizado é projeto futuro (replicar padrão ADR 0009 após provado em produção). Estradas/javali: sem alertas, só exibição.

---

## Fase 5 — Estradas e Javali como Dados de Base

**Depende de:** Fase 1. Independente das Fases 2–4 (mesmo padrão da Fase 3).

### 5.1 Migrations

`0011_estradas_junction.sql` — padrão idêntico à Fase 3:
- Criar `estradas_regioes(id, estrada_id, regiao_id)` + unique + índice por `regiao_id`
- Migrar `estradas.regiao_id` existente para a junction
- Segunda migration (após código): drop `regiao_id`, `tenant_id` de `estradas`

`0012_javali_junction.sql`:
- `javali_avistamentos` **não tem** `regiao_id` hoje — a migração inicial popula a junction por interseção espacial, não por coluna:

```sql
CREATE TABLE monitoramento.javali_regioes (
  id           UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  avistamento_id INT NOT NULL REFERENCES monitoramento.javali_avistamentos(id) ON DELETE CASCADE,
  regiao_id      INT NOT NULL REFERENCES monitoramento.regioes(id) ON DELETE CASCADE,
  UNIQUE (avistamento_id, regiao_id)
);
CREATE INDEX idx_javali_regioes_regiao ON monitoramento.javali_regioes(regiao_id);

INSERT INTO monitoramento.javali_regioes (avistamento_id, regiao_id)
SELECT j.id, r.id
FROM monitoramento.javali_avistamentos j
JOIN monitoramento.regioes r ON ST_Intersects(j.geom, r.geom)
ON CONFLICT DO NOTHING;
```

- Adicionar `created_by UUID` em `javali_avistamentos` (metadado de autoria, não dono — ADR 0008)
- Segunda migration: drop `tenant_id` de `javali_avistamentos`

### 5.2 Código

- `db/schema.ts`: adicionar as duas junctions; remover `tenantId`/`regiaoId` das tabelas base
- Repositórios de estradas e javali: filtrar via junction por `regiao_id`
- Rota de criação de avistamento: após INSERT, popular `javali_regioes` via `ST_Intersects` (mesma transação); gravar `created_by`
- `layer-resolver.ts` / `TABLE_DISPLAY_COLUMNS`: remover `tenant_id` das duas
- Import de estradas (admin): após upsert, inserir em `estradas_regioes`

### 5.3 Verificação

- [ ] Avistamento em área sobreposta aparece nas duas regiões (orgs diferentes)
- [ ] Avistamento fora de qualquer região: decidir na implementação — rejeitar com erro claro (recomendado) ou aceitar órfão invisível
- [ ] Import de estradas funciona; estrada cruzando duas regiões aparece em ambas

---

## Fase 6 — Dados do Tenant endurecidos (acoes, trilhas, waypoints)

**Depende de:** Fase 1.

### 6.1 Migration `0013_tenant_not_null.sql`

- Backfill: `UPDATE ... SET tenant_id = <seed> WHERE tenant_id IS NULL` em `acoes`, `trilhas`, `waypoints`
- `ALTER ... SET NOT NULL` em `tenant_id` das três + FK para `tenants(id)` (hoje não há FK)
- Índice `(tenant_id, regiao_id)` em cada uma
- `destinatarios_alertas.regiao_id`: adicionar FK para `regioes(id)` (hoje sem FK)

### 6.2 Código

- `db/schema.ts`: `tenantId` vira `.notNull()` nas três; FKs adicionadas
- Repositórios de acoes/trilhas/waypoints: `tenantId` obrigatório na assinatura (ADR 0010); remover padrão `tenantId ?? process.env.SEED_TENANT_ID`
- Todas as queries de leitura dessas tabelas filtram por `tenant_id` (auditar com grep por tabela)

### 6.3 Verificação

- [ ] Criar/editar/listar ação com duas orgs no banco: cada uma vê só as suas
- [ ] Fotos de ações seguem o isolamento da ação pai
- [ ] Trilhas/waypoints idem

---

## Fase 7 — layer_catalog multi-tenant

**Depende de:** Fase 1. Fazer após Fases 2–5 (as entradas de Dados de Base precisam existir com `scope: 'region'`).

**Modelo decidido:** camadas de Dados de Base = entrada global única (`tenant_id NULL`, `scope 'region'`); camadas custom/upload = `tenant_id NOT NULL`.

### 7.1 Migration `0014_layer_catalog_tenant.sql`

```sql
-- slug deixa de ser unique global
ALTER TABLE monitoramento.layer_catalog DROP CONSTRAINT layer_catalog_slug_unique;

-- Globais (tenant_id NULL): slug único entre elas
CREATE UNIQUE INDEX layer_catalog_slug_global_unique
  ON monitoramento.layer_catalog(slug) WHERE tenant_id IS NULL;

-- Por tenant: slug único dentro do tenant
CREATE UNIQUE INDEX layer_catalog_slug_tenant_unique
  ON monitoramento.layer_catalog(tenant_id, slug) WHERE tenant_id IS NOT NULL;
```

- Classificar as entradas existentes: `raw_firms`, `desmatamento`, `propriedades`, `estradas`, `javali` → `tenant_id = NULL`, `scope = 'region'`; demais → tenant seed
- `layer_data.tenant_id`: backfill a partir do `layer_catalog.tenant_id` da camada pai + NOT NULL para camadas custom

### 7.2 Código

- Resolver de camadas: listar catálogo = entradas globais ∪ entradas do tenant ativo
- Criação de camada custom (upload): grava `tenant_id` do request; validação de slug único por tenant (não mais global)
- CRUD admin de camadas: escopo por tenant

### 7.3 Verificação

- [ ] Duas orgs criam camada custom com o mesmo slug sem conflito
- [ ] Org A não vê camada custom da Org B; ambas veem as camadas de base nas suas regiões

---

## Fase 8 — Fim do SEED fallback e de user_access (ADR 0010)

**Depende de:** Fase 6 (repositórios sem SEED) e backfill de roles.

1. Backfill: para cada linha de `user_access` sem correspondente em `roles`, criar `roles(tenant_id, user_id, role, region_id)`
2. `requireAuthWithTenant()`: remover estágio 3 (SEED) — JWT → `roles` (trocar a consulta de fallback de `user_access` para `roles`) → 403. Fallback superadmin permanece
3. `app/api/admin/users/invite/route.ts`: parar dual-write em `user_access`
4. Remover `SEED_TENANT_ID` do ambiente, dos testes e do restante do código
5. Migration final: `DROP TABLE monitoramento.user_access` (após período de observação)

Verificação:
- [ ] Usuário sem vínculo → 403, não cai no tenant seed
- [ ] Todos os usuários reais continuam logando e vendo seus dados
- [ ] Grep por `SEED_TENANT_ID` e `user_access` retorna zero no código de produção

---

## Fase 9 — Onboarding via UI admin (critério de robustez)

**Depende de:** Fases 5–8.

**Critério de pronto:** superadmin onboarda uma organização nova de ponta a ponta **sem tocar no banco**:

1. Criar tenant (nome, slug, plano) — UI admin
2. Criar região (nome, geom via upload, cor) já vinculada ao tenant — UI existente, conferir que grava `organization_id` coluna (Fase 1)
3. Convidar owner — fluxo de invite existente (sem dual-write, pós Fase 8)
4. Importar dados de base da região (propriedades, desmatamento, estradas) — rotas `commit-*` existentes
5. FIRMS passa a cobrir a região automaticamente no próximo ciclo do `firms-sync` (sem config — `ST_Intersects` resolve)
6. Cadastrar `destinatarios_alertas` da região — UI admin

Gap a fechar nesta fase: o que faltar de UI nos passos 1 e 6 (auditar telas admin atuais). Auto-serviço pelo owner fica explicitamente fora de escopo (ADR 0005 mantido).

**Teste de aceitação final do projeto:** criar uma segunda organização fictícia com região sobreposta à atual e verificar: focos/desmatamento/propriedades/estradas/javali compartilhados aparecem para ambas; ações/trilhas de uma são invisíveis para a outra; alertas FIRMS chegam aos destinatários das duas regiões.

---

## Limpeza final (consolida a do plano anterior)

- Remover `metadata->>'organizationId'` de todos os ~18 consumidores restantes
- Atualizar `db/migrations/relations.ts`
- Atualizar `CONTEXT.md` com a taxonomia deste plano

## Ordem de execução

```
Fases 1–4 (plano FIRMS, em andamento)
   ↓
Fase 5 (estradas+javali)   Fase 6 (acoes/trilhas NOT NULL)   — independentes entre si
   ↓                            ↓
Fase 7 (layer_catalog)     Fase 8 (SEED/user_access)
              ↓
        Fase 9 (onboarding + teste de aceitação)
```
