import { z } from 'zod'

const positiveId = z.coerce.number().int().positive()

// "O que mudou desde que eu estive aqui" (DESIGN.md 13.8). `since` é o instante da última vez que a pessoa viu as novidades (do próprio
// banco, devolvido na consulta anterior); `acoes_after` é o maior id de ação que ela já viu (as ações antigas não têm created_at).
// Sem os dois é a primeira visita: a consulta só devolve o ponto de partida, sem novidade.
export const novidadesSchema = z.object({
  // sem região, vale a do próprio usuário (o escopo resolve): o mapa só leva o regiao_id quando ele vem na URL
  regiao_id: positiveId.optional(),
  since: z.string().datetime({ offset: true }).optional(),
  acoes_after: z.coerce.number().int().min(0).optional(),
})
export type NovidadesQuery = z.infer<typeof novidadesSchema>
