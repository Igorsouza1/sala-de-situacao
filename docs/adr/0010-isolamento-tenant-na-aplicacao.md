# Isolamento entre tenants é garantido na camada de aplicação — sem RLS, sem fallback SEED

O isolamento de dados entre Organizações é responsabilidade da camada de aplicação: todo repository que toca dado de tenant recebe `tenantId` (e/ou `regiaoId`) como parâmetro **obrigatório na assinatura**, nunca opcional, e toda rota o obtém via `requireAuthWithTenant()`. Não adotamos Row Level Security do Postgres neste ciclo.

O fallback `SEED_TENANT_ID` em `requireAuthWithTenant()` (`lib/api/require-auth.ts`) será **removido**: usuário autenticado sem tenant resolvível (JWT `app_metadata` → `roles`/`user_access`) recebe `403`, nunca cai silenciosamente dentro do tenant seed. Pré-requisito: backfill de `roles` para todos os usuários existentes.

O fallback de superadmin (sem tenant explícito → primeiro tenant) permanece, por ser restrito a `is_superadmin === true` e necessário para a UI admin.

## Considered Options

- **App-layer disciplinado + fim do SEED fallback** (escolhido): convenção forte (parâmetro obrigatório, sem default) + code review. Menor esforço; risco residual de um WHERE esquecido é mitigado porque os Dados de Base nem têm `tenant_id` (ADR 0008) — a superfície de vazamento se resume às tabelas operacionais (`acoes`, `trilhas`, `waypoints`, `fotos_acoes`, camadas custom).

- **RLS Postgres/Supabase agora** (descartado): defesa em profundidade real, mas o app usa conexão Drizzle direta (não `supabase-js`), o que exigiria `SET LOCAL` de contexto por request, políticas em ~15 tabelas e suíte de testes própria. Escopo grande demais somado à migração em andamento. Fica como evolução futura — o modelo escolhido não a impede.

- **RLS híbrido só nas tabelas sensíveis** (descartado): pagaria o custo de infraestrutura do RLS (contexto por request) sem eliminar a disciplina app-layer no resto — pior dos dois mundos neste momento.

## Consequências

- `requireAuthWithTenant()` passa a ter 3 estágios (JWT → tabelas → 403), não 4.
- `SEED_TENANT_ID` sai do ambiente e dos repositórios (padrão `tenantId ?? process.env.SEED_TENANT_ID` é removido).
- Ambiente de dev precisa de seed real de `roles` — não há mais atalho.
- Critério de aceite de qualquer PR que adicione query em tabela de tenant: filtro por `tenantId` presente e testado.
