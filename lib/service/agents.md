---
description: Regras de Service (orquestração e domínio)
globs: "lib/service/**/*.ts"
alwaysApply: true
---

# 002-service.mdc — Regras de Service

## Objetivo
**Orquestrar** fluxo e aplicar **regras de negócio**; nunca falar HTTP/Request.

## Regras
1) **Sem Request/Response** — apenas dados tipados.  
2) **Converte/normaliza** (datas, números, GeoJSON/WKT…).  
3) Chama **Repository**; **mapeia erros de domínio** (ex.: DUPLICATE).  
4) **Pureza** quando possível (fácil de testar).  
5) **Helpers** (ex.: `parseGeo`) ficam em `lib/helpers`.

## Snippet
```ts
import type { DequeInput } from "@/lib/validations/deque";
import { createDequeInDb } from "@/lib/repositories/dequeRepository";

export async function createDeque(input: DequeInput) {
  // Normalizações pontuais (ex.: arredondar casas decimais)
  return await createDequeInDb(input);
}


Checklist

 Sem HTTP no service

 Regras de negócio claras

 Normalizações/validações adicionais (quando cabível)

 Erros de domínio bem definidos

 Fácil de testar (dependências explícitas)