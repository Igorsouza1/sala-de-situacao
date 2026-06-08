# /admin restrito ao Superadmin; Owner acessa apenas /protected

A rota `/admin` verifica `app_metadata.is_superadmin === true` (via `checkIsSuperadmin()`). Owner com role `owner` em `monitoramento.roles` não tem acesso — é redirecionado para `/protected`.

## Considered Options

- **Owner acessa /admin também**: `checkIsAdmin()` já retornava true para owner; economizaria uma tela separada de gestão para Owner.
- **Superadmin-only** (escolhido): Owner opera dentro do escopo do seu próprio tenant; `/admin` expõe todas as Organizações e Regiões do sistema — Owner vendo dados de outros tenants violaria o isolamento multi-tenant definido no CONTEXT.md.
