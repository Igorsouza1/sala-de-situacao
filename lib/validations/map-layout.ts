import { z } from 'zod'

const positiveId = z.coerce.number().int().positive()

// A organização das camadas de cada pessoa (DESIGN.md 13.1 e 13.2). Sem `regiao_id`, vale a região do próprio usuário (o escopo resolve).
// O layout em si NÃO é descrito aqui: `parseLayout` o valida campo a campo e descarta o que não serve.
export const layoutQuerySchema = z.object({
  regiao_id: positiveId.optional(),
})

export const layoutBodySchema = z.object({
  regiao_id: positiveId.optional(),
  layout: z.unknown(),
})
