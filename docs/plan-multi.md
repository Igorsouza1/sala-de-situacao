Diagnóstico: dois sistemas de roles em paralelo

  O que está sendo usado hoje

  ┌──────────────────────────────┬─────────────────────────────────────────────┬───────────────────────────────────┐
  │       Ponto do sistema       │              Tabela consultada              │             Propósito             │
  ├──────────────────────────────┼─────────────────────────────────────────────┼───────────────────────────────────┤
  │ useUserRole.ts (hook         │ public.profiles.role                        │ Decide se o usuário é Admin na UI │
  │ frontend)                    │                                             │                                   │
  ├──────────────────────────────┼─────────────────────────────────────────────┼───────────────────────────────────┤
  │ app/api/user/route.ts        │ public.profiles.full_name                   │ Nome do usuário                   │
  ├──────────────────────────────┼─────────────────────────────────────────────┼───────────────────────────────────┤
  │ require-region.ts            │ monitoramento.user_access.regiao_id         │ Resolve região do usuário para    │
  │                              │                                             │ filtrar camadas                   │
  ├──────────────────────────────┼─────────────────────────────────────────────┼───────────────────────────────────┤
  │ organizationRepository.ts    │ monitoramento.user_access +                 │ Lista orgs/regiões do admin       │
  │                              │ monitoramento.tenants                       │                                   │
  └──────────────────────────────┴─────────────────────────────────────────────┴───────────────────────────────────┘

  O que não está sendo usado em runtime

  - monitoramento.roles — existe no banco e no schema Drizzle, mas nenhuma rota ou serviço a consulta. Só aparece em
  testes de schema e nas migrations.

  ---
  O problema

  O sistema de permissões está partido em duas lógicas incompatíveis:

  1. public.profiles.role — string simples ("Admin" / "viewer"), sem vínculo a tenant nem região. O useUserRole toma
  decisões de UI com base nisso.
  2. monitoramento.user_access — tem user_id + organization_id + regiao_id + role, é o que realmente deveria controlar
  acesso. É consultado só para resolver regiao_id, não para verificar permissão.
  3. monitoramento.roles — tabela RBAC completa criada na Fase 1 (owner/admin/editor/viewer/auditor por tenant e
  região), completamente ignorada pelo código de runtime.

  ---
  O que precisa ser alinhado

  A pergunta é: qual deve ser a fonte da verdade? Com base no plan.md (Fase 1.2), a resposta é monitoramento.roles,
  pois:
  - Está vinculada ao tenant (tenant_id) e à região (region_id)
  - Tem hierarquia de 5 níveis (owner/admin/editor/viewer/auditor)
  - Foi projetada para o RBAC multi-tenant

  Quer que eu substitua public.profiles.role por monitoramento.roles nos pontos que importam? Os dois arquivos centrais
  seriam:

  1. hooks/useUserRole.ts — trocar profiles.role === "Admin" por uma query em monitoramento.roles filtrando pelo tenant
  do usuário
  2. lib/api/require-auth.ts (ou novo helper) — adicionar verificação de role no servidor para proteger rotas admin