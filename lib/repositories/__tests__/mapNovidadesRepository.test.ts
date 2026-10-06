import { PgDialect } from 'drizzle-orm/pg-core'
import { db } from '@/db'
import { queryNovidades } from '../mapNovidadesRepository'

jest.mock('@/db', () => ({ db: { execute: jest.fn() } }))
const execute = jest.mocked(db.execute)
const dialect = new PgDialect()
const compiled = () => execute.mock.calls.map((c) => dialect.sqlToQuery(c[0] as never))

beforeEach(() => {
  jest.clearAllMocks()
  execute.mockImplementation(((q: never) => {
    const text = dialect.sqlToQuery(q).sql
    if (text.includes('SELECT now()')) return Promise.resolve({ rows: [{ now: '2026-10-06T12:00:00Z' }] })
    if (text.includes('MAX(a.id)')) return Promise.resolve({ rows: [{ max_id: 42 }] })
    return Promise.resolve({ rows: [] })
  }) as never)
})

test('primeira visita: só devolve de onde partir e não consulta as fontes', async () => {
  const result = await queryNovidades('org', 7, { regiao_id: 7 })
  expect(result).toMatchObject({ now: '2026-10-06T12:00:00.000Z', acoesMaxId: 42, focos: { count: 0 }, desmatamento: { count: 0 }, acoes: { count: 0 } })
  expect(compiled().some((q) => q.sql.includes('firms_regioes'))).toBe(false)
})

test('com ponto de partida: focos e desmatamento pelo vínculo com a região, ações pelo id e pelo escopo', async () => {
  await queryNovidades('org', 7, { regiao_id: 7, since: '2026-10-01T00:00:00.000Z', acoes_after: 40 })
  const queries = compiled()
  const focos = queries.find((q) => q.sql.includes('firms_regioes'))!
  expect(focos.sql).toContain('created_at >')
  expect(focos.params).toEqual(expect.arrayContaining([7, '2026-10-01T00:00:00.000Z']))
  expect(queries.find((q) => q.sql.includes('desmatamento_regioes'))).toBeDefined()
  const acoes = queries.find((q) => q.sql.includes('a.id >'))!
  expect(acoes.sql).toContain('a.tenant_id =')
  expect(acoes.sql).toContain('r.organization_id =')
  expect(acoes.params).toEqual(expect.arrayContaining(['org', 7, 40]))
})

test('a hora de comparação é a do banco, não a do aparelho', async () => {
  await queryNovidades('org', 7, { regiao_id: 7 })
  expect(compiled()[0].sql).toContain('SELECT now()')
})
