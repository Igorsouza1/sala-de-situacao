import { PgDialect } from 'drizzle-orm/pg-core'
import { db } from '@/db'
import { queryAcoesResumo } from '../mapAcoesResumoRepository'

jest.mock('@/db', () => ({ db: { execute: jest.fn() } }))
const execute = jest.mocked(db.execute)
const dialect = new PgDialect()

test('todas as ações da região, pela organização e pela interseção, sem filtro de período', async () => {
  execute.mockResolvedValue({ rows: [{ status: 'Identificado', carater: 'Passivo', eixo_tematico: 'Solo & Relevo', ano: 2026, count: 3 }] } as never)
  const groups = await queryAcoesResumo('org', 7)
  expect(groups).toEqual([{ status: 'Identificado', carater: 'Passivo', eixo_tematico: 'Solo & Relevo', ano: 2026, count: 3 }])
  const q = dialect.sqlToQuery(execute.mock.calls[0][0] as never)
  expect(q.sql).toContain('a.tenant_id =')
  expect(q.sql).toContain('r.organization_id =')
  expect(q.sql).toContain('ST_Intersects(a.geom, r.geom)')
  expect(q.sql).not.toMatch(/a\.time\s*(>=|<=|>|<|BETWEEN)/i)
  expect(q.params).toEqual(expect.arrayContaining(['org', 7]))
})
