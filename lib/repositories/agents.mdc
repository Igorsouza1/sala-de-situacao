---
description: Regras de Repository (Drizzle/SQL)
globs: "lib/repositories/**/*.ts"
alwaysApply: true
---

# 003-repository.mdc — Acesso a dados

## Objetivo
**Somente** queries e mapeamento de colunas. Sem regra de negócio.

## Regras
1) **Sem lógica** além de montar/executar query.  
2) **Retornar tipos previsíveis** (campos nomeados).  
3) Ordenação/paginação implementadas aqui quando for parte da query.  
4) **Sem try/catch** amplo (deixe estourar para o handler mapear).

## Snippet
```ts
import { db } from "@/db";
import { dequeDePedrasInRioDaPrata } from "@/db/schema";

export async function createDequeInDb(input: {
  data: Date; turbidez: number; secchiVertical: number; secchiHorizontal: number; chuva: number;
}) {
  return await db.insert(dequeDePedrasInRioDaPrata).values(input).execute();
}


Checklist
 Nenhuma regra de negócio

 Campos explicitamente selecionados/nomeados

 Paginação/ordenar quando necessário

 Sem capturar erros genéricos (deixa o service decidir)

