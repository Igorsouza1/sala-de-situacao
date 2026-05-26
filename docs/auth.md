# Autenticação e Níveis de Acesso — Sala de Situação

**Versão:** 1.0  
**Data:** 26 de maio de 2026  
**Referência:** `docs/plan.md` (Fases 0, 1.2, 2)

---

## Fonte da Verdade

O controle de acesso do sistema usa **duas tabelas**, mas apenas uma é a fonte da verdade para permissões:

| Tabela | Função | Status |
|---|---|---|
| `public.profiles.role` | Role legado ("Admin" / "viewer"), sem vínculo a tenant ou região | **Ignorado** — não usar para decisões de acesso |
| `monitoramento.roles` | RBAC multi-tenant com 5 níveis, vinculado a tenant e região | **Fonte da verdade** |

Toda verificação de permissão — tanto na API (`requireAdmin()`) quanto na UI (`useUserRole`) — lê exclusivamente de `monitoramento.roles`.

---

## Estrutura de `monitoramento.roles`

```sql
CREATE TABLE monitoramento.roles (
  id         SERIAL PRIMARY KEY,
  tenant_id  UUID NOT NULL REFERENCES monitoramento.tenants(id),
  user_id    UUID NOT NULL,              -- auth.users.id
  role       VARCHAR(20) NOT NULL DEFAULT 'viewer'
             CHECK (role IN ('owner','admin','editor','viewer','auditor')),
  region_id  INT REFERENCES monitoramento.regioes(id), -- NULL = acesso ao tenant inteiro
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (tenant_id, user_id, region_id)
);
```

**`region_id`:** quando preenchido, o acesso desse usuário se restringe àquela região específica. Quando `NULL`, o usuário tem acesso a todas as regiões do tenant.

---

## Os 5 Níveis de Acesso

### `owner` — Proprietário do Tenant

O nível mais alto. Existe um por tenant. Representa a organização dona da instância.

**Pode:**
- Tudo que `admin` pode
- Criar e excluir o próprio tenant
- Gerenciar outros usuários (promover, rebaixar, remover)
- Alterar configurações globais do tenant (plano, cota de armazenamento, slug)
- Ver e editar usuários de qualquer role, incluindo outros admins

**Não pode:**
- Acessar dados de outros tenants

**Quando criar:** somente na criação do tenant. Normalmente é o responsável técnico ou gestor da organização que contratou a instância.

---

### `admin` — Administrador Operacional

Usuário de confiança da organização com acesso total às funcionalidades operacionais.

**Pode:**
- Acessar o painel admin (`/admin/*`)
- Ver a aba "Camadas" na navbar
- Fazer upload de arquivos GPX / Shapefiles
- Gerenciar alertas (adicionar/remover destinatários, configurar preferências)
- Criar, editar e excluir Ações no mapa
- Gerenciar o Layer Catalog (criar, editar cores, reordenar camadas)
- Commitar dados de desmatamento, focos, propriedades, estradas
- Ver e editar o dossier de propriedades

**Não pode:**
- Gerenciar usuários (isso é `owner`)
- Alterar configurações do tenant

**Quando criar:** técnicos de campo sênior, coordenadores de monitoramento, gestores que precisam inserir dados e configurar o sistema.

---

### `editor` — Editor de Dados

Usuário que opera no campo e precisa inserir e editar dados, mas sem acesso às configurações do sistema.

**Pode:**
- Acessar o mapa e dashboard
- Criar e editar Ações
- Fazer upload de GPX / Shapefiles
- Ver dossier de propriedades

**Não pode:**
- Acessar o painel admin
- Gerenciar alertas
- Commitar dados de desmatamento, focos, estradas, propriedades
- Alterar o Layer Catalog

**Quando criar:** técnicos de campo, brigadistas, agentes de monitoramento que registram ocorrências e trilhas.

---

### `viewer` — Visualizador

Acesso somente leitura. Vê os dados, não altera nada.

**Pode:**
- Acessar o mapa
- Acessar o dashboard
- Ver todas as camadas visíveis para o tenant/região

**Não pode:**
- Inserir, editar ou excluir qualquer dado
- Acessar o painel admin
- Fazer upload de qualquer arquivo

**Quando criar:** parceiros externos, representantes de órgãos públicos (prefeituras, secretarias), pesquisadores que precisam acompanhar o monitoramento sem operar o sistema.

---

### `auditor` — Auditor

Nível de leitura avançado. Similar ao `viewer`, mas com visibilidade sobre logs e histórico de operações. Útil para prestação de contas e fiscalização.

**Pode:**
- Tudo que `viewer` pode
- Ver histórico de alterações e logs de operações (quando implementado)
- Exportar relatórios

**Não pode:**
- Inserir, editar ou excluir qualquer dado
- Acessar configurações do sistema

**Quando criar:** fiscais de órgãos ambientais (IBAMA, SEMA, ICMBio), auditores internos, representantes de financiadores que precisam verificar as atividades registradas.

---

## Hierarquia de Permissões

```
owner
  └── admin
        └── editor
              └── viewer
              └── auditor  (viewer com logs)
```

Cada nível herda as permissões de leitura do nível abaixo. `editor` e `auditor` são paralelos — ambos abaixo de `admin`, mas com funções distintas (escrita vs. visibilidade de logs).

---

## Como Adicionar um Usuário

### Passo 1 — Criar a conta de autenticação

O usuário precisa existir em `auth.users`. Isso acontece quando ele se cadastra via tela de login ou quando um `owner`/`admin` o convida via Supabase Dashboard → Authentication → Invite user.

### Passo 2 — Inserir em `monitoramento.roles`

```sql
INSERT INTO monitoramento.roles (tenant_id, user_id, role, region_id)
VALUES (
  'ec15c167-8081-4dae-9ddd-6061c4ae58e3',  -- tenant_id (SEED_TENANT_ID)
  '<uuid do usuário em auth.users>',
  'viewer',       -- trocar pelo role desejado
  NULL            -- NULL = acesso a todas as regiões; ou integer do id da região
);
```

Para buscar o `user_id` pelo e-mail:
```sql
SELECT id, email FROM auth.users WHERE email = 'nome@dominio.com';
```

### Passo 3 — Verificar

```sql
SELECT au.email, r.role, r.region_id
FROM monitoramento.roles r
JOIN auth.users au ON au.id = r.user_id
WHERE r.tenant_id = 'ec15c167-8081-4dae-9ddd-6061c4ae58e3'
ORDER BY r.role;
```

---

## Como Alterar o Role de um Usuário

```sql
UPDATE monitoramento.roles
SET role = 'admin'          -- novo role
WHERE user_id = '<uuid>'
  AND tenant_id = 'ec15c167-8081-4dae-9ddd-6061c4ae58e3';
```

---

## Como Remover Acesso

```sql
DELETE FROM monitoramento.roles
WHERE user_id = '<uuid>'
  AND tenant_id = 'ec15c167-8081-4dae-9ddd-6061c4ae58e3';
```

Isso **não** deleta a conta do usuário em `auth.users` — apenas remove o acesso ao sistema. Para deletar a conta por completo, usar o Supabase Dashboard → Authentication → Users → Delete.

---

## Acesso por Região

Um usuário pode ter acesso restrito a uma região específica:

```sql
-- Acesso apenas à região 2
INSERT INTO monitoramento.roles (tenant_id, user_id, role, region_id)
VALUES ('ec15c167-...', '<uuid>', 'viewer', 2);
```

Um usuário pode ter múltiplos registros — um por região — com roles diferentes:

```sql
-- admin na região 1, viewer na região 3
INSERT INTO monitoramento.roles (tenant_id, user_id, role, region_id) VALUES ('ec15c167-...', '<uuid>', 'admin', 1);
INSERT INTO monitoramento.roles (tenant_id, user_id, role, region_id) VALUES ('ec15c167-...', '<uuid>', 'viewer', 3);
```

---

## Verificação Técnica

### API (server-side) — `lib/api/require-auth.ts`

| Helper | O que faz |
|---|---|
| `requireAuth()` | Verifica sessão ativa. Retorna 401 se não logado. |
| `requireAuthWithTenant()` | Verifica sessão + resolve `tenant_id`. Retorna 403 se sem tenant. |
| `requireAdmin()` | Tudo acima + verifica `role IN ('owner','admin')` em `monitoramento.roles`. Retorna 403 se insuficiente. |

### UI (client-side) — `hooks/useUserRole.ts` + `GET /api/auth/role`

O hook chama `/api/auth/role` que executa a mesma lógica de `requireAdmin()` server-side. Retorna `{ isAdmin: boolean }`.

`isAdmin = true` quando o usuário tem `role = 'owner'` ou `role = 'admin'`.

Os roles `editor`, `viewer` e `auditor` retornam `isAdmin = false` — a UI mostra apenas mapa e dashboard.

---

## Regras de Boas Práticas

1. **Mínimo privilégio:** criar o usuário sempre no menor nível necessário. Promover se precisar, nunca "por precaução".
2. **`owner` é único:** não criar múltiplos `owner` no mesmo tenant.
3. **Nunca usar `public.profiles.role`:** essa coluna existe por legado e será removida. Não consultá-la para decisões de acesso.
4. **Usuários sem entrada em `monitoramento.roles` não têm acesso:** criar a conta em `auth.users` sem inserir em `monitoramento.roles` resulta em login bem-sucedido mas sem acesso a nenhuma funcionalidade.
5. **Acesso por região é cumulativo:** se o usuário tem `NULL` e também tem `region_id = 1`, o `NULL` prevalece — ele vê tudo.
