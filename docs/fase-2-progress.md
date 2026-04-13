# Fase 2 — Multi-Tenancy: Contexto no Runtime: Progress Tracker

> Ativa isolamento real de tenant nas queries sem alterar a interface da API.
> Feature flag `NEXT_PUBLIC_MULTI_TENANT` controla ativação gradual.

## Checklist

- [X] **2.1** — `lib/feature-flags.ts` + `lib/api/tenant-context.ts`
- [X] **2.2** — Expandir `require-auth.ts` com `requireAuthWithTenant()`
- [X] **2.3** — Atualizar repositories com filtro de `tenantId`
  - [X] `acoesRepository.ts`
  - [X] `propriedadesRepository.ts`
  - [X] `layerRepository.ts`
  - [X] `firmsRepository.ts`
  - [X] `desmatamentoReposiroty.ts`
  - [X] `estradasRepository.ts`
- [X] **2.4** — Atualizar services + rotas para usar `requireAuthWithTenant()`
- [X] **2.5** — Ownership check nas rotas com `[id]`

---

## Variável de ambiente necessária

```env
# .env.local
NEXT_PUBLIC_MULTI_TENANT=false          # true para ativar isolamento real
SEED_TENANT_ID=<uuid-do-tenant-atual>   # fallback quando MULTI_TENANT=false
```

---

## Regra de rollback

Setar `NEXT_PUBLIC_MULTI_TENANT=false` → todos os repositories usam SEED_TENANT_ID
e o comportamento da API fica idêntico ao estado pré-Fase 2.
