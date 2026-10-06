import { PgDialect } from 'drizzle-orm/pg-core'
import { db } from '@/db'
import { queryLinhaDoTempo } from '../mapLinhaDoTempoRepository'

jest.mock('@/db', () => ({ db: { execute: jest.fn() } }))
const execute = jest.mocked(db.execute)
const dialect = new PgDialect()
const compiled = () => execute.mock.calls.map((c) => dialect.sqlToQuery(c[0] as never))

beforeEach(() => {
  jest.clearAllMocks()
  execute.mockImplementation(((q: never) => {
    const text = dialect.sqlToQuery(q).sql
    if (text.includes('raw_firms')) return Promise.resolve({ rows: [{ mes: '2026-03', n: '4' }] })
    if (text.includes('monitoramento.desmatamento ')) return Promise.resolve({ rows: [{ mes: '2025-08', n: 2 }] })
    return Promise.resolve({ rows: [{ mes: '2026-02', n: 9 }] })
  }) as never)
})

test('devolve as três séries com a contagem como número', async () => {
  const result = await queryLinhaDoTempo('org', 7)
  expect(result).toEqual({
    focos: [{ mes: '2026-03', n: 4 }],
    desmatamento: [{ mes: '2025-08', n: 2 }],
    acoes: [{ mes: '2026-02', n: 9 }],
  })
})

test('focos e desmatamento pelo vínculo com a região', async () => {
  await queryLinhaDoTempo('org', 7)
  const q = compiled()
  const focos = q.find((x) => x.sql.includes('firms_regioes'))!
  expect(focos.params).toContain(7)
  const desm = q.find((x) => x.sql.includes('desmatamento_regioes'))!
  expect(desm.params).toContain(7)
})

test('o desmatamento lê só o começo AAAA-MM e ignora o que não tem esse formato', async () => {
  await queryLinhaDoTempo('org', 7)
  const desm = compiled().find((x) => x.sql.includes('desmatamento_regioes'))!
  expect(desm.sql).toContain('left(d.detectat, 7)')
  expect(desm.sql).toMatch(/detectat ~ /)
})

test('ações pela organização e pela interseção com a região', async () => {
  await queryLinhaDoTempo('org', 7)
  const acoes = compiled().find((x) => x.sql.includes('monitoramento.acoes'))!
  expect(acoes.sql).toContain('a.tenant_id =')
  expect(acoes.sql).toContain('r.organization_id =')
  expect(acoes.params).toEqual(expect.arrayContaining(['org', 7]))
})
