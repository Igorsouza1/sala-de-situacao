---
description: Regras do Handler HTTP (Next.js App Router)
globs: "app/api/**/route.ts"
alwaysApply: true
---

# 001-handler.mdc — Handler fino

## Objetivo
Receber request → validar/parciar → chamar service → padronizar resposta.

## Regras
1) **Nada de lógica de negócio** aqui.  
2) **Zod** para `query`/`body` (importar de `lib/validations`).  
3) Retornar **apenas** `apiSuccess`/`apiError`.  
4) **Mapear erros**: 400/401/403/404/409/422/500.  
5) **Logs sem PII**; sempre `try/catch`.

## Snippet
```ts
import { apiError, apiSuccess } from "@/lib/api/responses";
import { createDequeSchema } from "@/lib/validations/deque";
import { createDeque } from "@/lib/service/dequeService";

export async function POST(request: Request) {
  try {
    const json = await request.json().catch(() => null);
    if (!json) return apiError("Body JSON é obrigatório.", 400);

    const parsed = createDequeSchema.safeParse(json);
    if (!parsed.success) return apiError("Body inválido.", 400, parsed.error.flatten());

    const created = await createDeque(parsed.data);
    return apiSuccess(created, { created: true });
  } catch (e: any) {
    if (e?.code === "DUPLICATE") return apiError("Registro já existe.", 409);
    return apiError("Falha interna.", 500);
  }
}


Checklist

 Handler fino (sem regra de negócio)

 Zod aplicado

 Apenas apiSuccess/apiError

 Códigos de erro corretos

 Logs sem PII