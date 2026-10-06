import { z } from 'zod'

// sem região, vale a do próprio usuário (o escopo resolve): o mapa só leva o regiao_id quando ele vem na URL
export const linhaDoTempoSchema = z.object({
  regiao_id: z.coerce.number().int().positive().optional(),
})
export type LinhaDoTempoQuery = z.infer<typeof linhaDoTempoSchema>
