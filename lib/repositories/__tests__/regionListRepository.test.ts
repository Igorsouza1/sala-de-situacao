import { PgDialect } from 'drizzle-orm/pg-core'
import { db } from '@/db'
import { listAccessibleRegions } from '../regionListRepository'

jest.mock('@/db', () => ({ db: { execute: jest.fn() } }))
const execute = jest.mocked(db.execute)
const dialect = new PgDialect()
const lastQuery = () => dialect.sqlToQuery(execute.mock.calls[execute.mock.calls.length - 1][0] as never)

beforeEach(() => {
  jest.clearAllMocks()
  execute.mockResolvedValue({ rows: [{ id: 1, nome: 'Bonito e Rio da Prata', municipio: 'Bonito', uf: 'MS', organizacao: 'IHP' }] } as never)
})

test('superadmin: todas as regiões, de qualquer organização, sem olhar os papéis', async () => {
  const list = await listAccessibleRegions('u', true)
  expect(list).toHaveLength(1)
  expect(lastQuery().sql).not.toContain('monitoramento.roles')
})

test('os demais: as regiões dos papéis, em todas as organizações da pessoa', async () => {
  await listAccessibleRegions('u', false)
  const q = lastQuery()
  // o papel vale na organização dona da região: dono vê todas as dela, os outros só a região do papel
  expect(q.sql).toContain('p.tenant_id = r.organization_id')
  expect(q.sql).toContain("p.role = 'owner' OR p.region_id = r.id")
  // nenhuma organização fixa: quem tem papel em duas vê as regiões das duas
  expect(q.sql).not.toContain('r.organization_id = $')
  expect(q.params).toEqual(['u'])
})
