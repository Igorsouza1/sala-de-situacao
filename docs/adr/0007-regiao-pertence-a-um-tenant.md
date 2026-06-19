# Região pertence a exatamente um Tenant

Uma Região pertence a exatamente uma Organização. A associação é armazenada como coluna `tenant_id UUID NOT NULL FK → tenants.id` diretamente na tabela `regioes` — não como campo em `metadata` JSON.

## Considered Options

- **`tenant_id` FK na tabela `regioes`** (escolhido): relação explícita, indexável, com constraint de integridade referencial.
- **`metadata->>'organizationId'` JSON** (situação anterior): sem FK, sem NOT NULL, sem índice. Inconsistências silenciosas — uma região poderia existir sem organização dona, ou com um UUID que não corresponde a nenhum tenant.
- **Junction table `tenants_regioes`** (descartado): permitiria que uma Região fosse compartilhada entre múltiplos tenants. Descartado porque o domínio define que uma Região é definida e gerenciada por uma única Organização. Se dois tenants precisam monitorar a mesma área geográfica, cada um cria sua própria Região com o mesmo polígono — não compartilham a mesma entidade.
