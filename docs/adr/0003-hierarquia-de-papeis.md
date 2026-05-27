# Hierarquia de papéis: Superadmin, Owner, Editor, Viewer, Auditor

Adotamos cinco papéis em dois escopos distintos. Superadmin é global (cross-tenant) e opera sobre todas as Organizações. Os demais papéis são scoped à Organização do usuário. Editor pode fazer Importações de dados externos — não é exclusividade de Owner. Owner gerencia usuários da própria Organização (incluindo criar outros Owners). O papel "admin" do código legado está sendo renomeado para Owner e o "owner" legado está sendo consolidado nesse mesmo papel, eliminando a ambiguidade anterior entre os dois termos.

## Considered Options

- **owner + admin (legado)**: dois papéis com nomes que causavam confusão sobre qual tem mais poder.
- **Superadmin + Owner + Editor + Viewer + Auditor** (escolhido): nomenclatura que deixa claro o escopo (global vs org) e o nível de poder.
