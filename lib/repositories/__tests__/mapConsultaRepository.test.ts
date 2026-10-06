import { PgDialect } from 'drizzle-orm/pg-core'
import { db } from '@/db'
import { queryMapConsulta } from '../mapConsultaRepository'
import { consultaSchema } from '@/lib/validations/map-consulta'

jest.mock('@/db', () => ({ db: { execute: jest.fn() } }))
const execute = jest.mocked(db.execute)
const dialect = new PgDialect()
beforeEach(() => { jest.clearAllMocks(); execute.mockResolvedValue({ rows: [] } as never) })
async function compiled(params: Record<string, string>) {
  await queryMapConsulta('organization', 7, consultaSchema.parse(params))
  return dialect.sqlToQuery(execute.mock.calls[0][0] as never)
}
test('Ações exigem Organização e interseção com a Região autorizada', async () => {
  const result = await compiled({ kind: 'acoes', id: '99' })
  expect(result.sql).toContain('a.tenant_id =')
  expect(result.sql).toContain('r.organization_id =')
  expect(result.sql).toContain('ST_Intersects("a".geom, r.geom)')
  expect(result.params).toContain('organization')
  expect(result.params).toContain(7)
  expect(result.params).toContain(99)
})
test('Propriedades são Dados de Base: escopo espacial, sem filtrar pelo tenant legado', async () => {
  const result = await compiled({ kind: 'propriedades' })
  expect(result.sql).toContain('ST_Intersects("p".geom, r.geom)')
  expect(result.sql).not.toContain('p.tenant_id')
})
test('recentes seguem inserção, sem cortar atividades antigas', async () => {
  const result = await compiled({ kind: 'acoes' })
  expect(result.sql).toContain('ORDER BY a.id DESC')
  expect(result.sql).not.toMatch(/a.time\s*[<>]/)
  expect(result.sql).not.toContain('AS geometry')
  expect(result.params.slice(-2)).toEqual([21, 0])
})
test('vínculo de Propriedade usa interseção e escopo, não FK', async () => {
  const result = await compiled({ propriedade_id: '42' })
  expect(result.sql).toContain('ST_Intersects(p.geom, a.geom)')
  expect(result.params).toContain(42)
})
test('busca escapa curingas e permanece parametrizada', async () => {
  const result = await compiled({ kind: 'propriedades', q: "Santa%_' OR TRUE" })
  expect(result.sql).not.toContain("OR TRUE")
  expect(result.params).toContain("%Santa\\%\\_' OR TRUE%")
})
test('consulta por área só é adicionada quando fornecida', async () => {
  const result = await compiled({ bbox: '-57,-22,-56,-21' })
  expect(result.sql).toContain('ST_MakeEnvelope')
  expect(result.params).toEqual(expect.arrayContaining([-57, -22, -56, -21]))
})
