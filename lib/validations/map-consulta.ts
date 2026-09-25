import { z } from 'zod'

const positiveId = z.coerce.number().int().positive()
export const consultaSchema = z.object({
  kind: z.enum(['acoes', 'propriedades']).default('acoes'),
  regiao_id: positiveId.optional(),
  id: positiveId.optional(),
  propriedade_id: positiveId.optional(),
  q: z.string().trim().max(150).default(''),
  offset: z.coerce.number().int().min(0).max(100000).default(0),
  bbox: z.string().transform(value => value.split(',').map(Number)).pipe(
    z.tuple([z.number().min(-180).max(180), z.number().min(-90).max(90),
      z.number().min(-180).max(180), z.number().min(-90).max(90)])
      .refine(([w, s, e, n]) => w < e && s < n, 'Área inválida')
  ).optional(),
})
export type ConsultaQuery = z.infer<typeof consultaSchema>
