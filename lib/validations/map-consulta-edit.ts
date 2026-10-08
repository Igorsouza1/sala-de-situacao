import { z } from 'zod'

// Edição de um registro do Explorar (ADR 0012). Só entram os campos descritivos: geometria e chaves ficam de fora.
// O CAR (chave natural da Propriedade) só o Superadmin altera; a rota recusa para os demais papéis.
const text = (max: number) => z.string().trim().max(max).transform((v) => (v === '' ? null : v)).nullable()
const requiredText = (max: number) => z.string().trim().min(1, 'Escreva um nome.').max(max)

export const ACAO_STATUS = ['Identificado', 'Em Recuperação', 'Concluído'] as const
export const ACAO_CATEGORIAS = ['Fiscalização', 'Recuperação', 'Incidente', 'Monitoramento', 'Infraestrutura'] as const

export const acaoFieldsSchema = z.object({
  nome: requiredText(255),
  descricao: text(255),
  status: z.enum(ACAO_STATUS),
  categoria: z.enum(ACAO_CATEGORIAS),
}).partial().strict()

export const propriedadeFieldsSchema = z.object({
  nome: requiredText(255),
  titular: text(255),
  municipio: text(100),
  car: requiredText(100),
}).partial().strict()

const positiveId = z.number().int().positive()
export const consultaEditSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('acoes'), id: positiveId, regiao_id: positiveId, fields: acaoFieldsSchema }),
  z.object({ kind: z.literal('propriedades'), id: positiveId, regiao_id: positiveId, fields: propriedadeFieldsSchema }),
])
export type ConsultaEdit = z.infer<typeof consultaEditSchema>
export type AcaoFields = z.infer<typeof acaoFieldsSchema>
export type PropriedadeFields = z.infer<typeof propriedadeFieldsSchema>
