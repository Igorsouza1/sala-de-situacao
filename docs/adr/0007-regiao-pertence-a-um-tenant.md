# Região pertence a exatamente um Tenant

Uma Região pertence a exatamente uma Organização. A associação é armazenada como coluna `organization_id UUID NOT NULL FK → tenants.id` diretamente na tabela `regioes` — não como campo em `metadata` JSON.

Nome da coluna é `organization_id`, não `tenant_id` — inconsistente com outras tabelas (`acoes.tenant_id`, `raw_firms.tenant_id`), mantido assim intencionalmente porque a coluna já existia com esse nome e FK aplicada em produção antes desta ADR ser corrigida; renomear exigiria migração adicional sem ganho funcional.

## Considered Options

- **`organization_id` FK na tabela `regioes`** (escolhido): relação explícita, indexável, com constraint de integridade referencial.
- **`metadata->>'organizationId'` JSON** (situação anterior): sem FK, sem NOT NULL, sem índice. Inconsistências silenciosas — uma região poderia existir sem organização dona, ou com um UUID que não corresponde a nenhum tenant.
- **Junction table `tenants_regioes`** (descartado): permitiria que uma Região fosse compartilhada entre múltiplos tenants. Descartado porque o domínio define que uma Região é definida e gerenciada por uma única Organização. Se dois tenants precisam monitorar a mesma área geográfica, cada um cria sua própria Região com o mesmo polígono — não compartilham a mesma entidade.
