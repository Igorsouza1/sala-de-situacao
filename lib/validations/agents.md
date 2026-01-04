---
description: Regras de Validação (Zod)
globs: "lib/validations/**/*.ts"
alwaysApply: true
---

# 004-validations.mdc — Schemas Zod

## Objetivo
**Padronizar** schemas e tipos inferidos para uso em rotas e services.

## Regras
1) Um arquivo por recurso: `lib/validations/<recurso>.ts`.  
2) **Exportar schema + type** (`z.infer`).  
3) Usar `z.coerce` para inputs vindos de query/body.  
4) Mensagens claras; separar validação **de formato** vs **de domínio** (domínio no service).

## Snippets (curtos)

### Deque de Pedras
```ts
import { z } from "zod";
export const createDequeSchema = z.object({
  data: z.coerce.date({ errorMap: () => ({ message: "Por favor, insira uma data válida." }) }),
  turbidez: z.coerce.number().min(0, { message: "Turbidez não pode ser negativa." }),
  secchiVertical: z.coerce.number().min(0, { message: "Secchi Vertical não pode ser negativo." }),
  secchiHorizontal: z.coerce.number().min(0, { message: "Secchi Horizontal não pode ser negativo." }),
  chuva: z.coerce.number().min(0, { message: "Chuva não pode ser negativa." }),
});
export type DequeInput = z.infer<typeof createDequeSchema>;
Estradas
ts
Copiar código
import { z } from "zod";
export const createEstradaSchema = z.object({
  nome: z.string().min(1),
  tipo: z.string().min(1),
  codigo: z.string().min(1),
  geom: z.string().min(1), // GeoJSON/WKT — validar formato no service
});
export type CreateEstradaInput = z.infer<typeof createEstradaSchema>;