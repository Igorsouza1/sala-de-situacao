import { PgDialect } from 'drizzle-orm/pg-core'
import { db } from '@/db'
import { getAccessibleRegionIdsForUser } from '@/lib/api/require-region'
import { listAccessibleRegions } from '../regionListRepository'

jest.mock('@/db', () => ({ db: { execute: jest.fn() } }))
jest.mock('@/lib/api/require-region', () => ({ getAccessibleRegionIdsForUser: jest.fn() }))
const execute = jest.mocked(db.execute)
const allowed = jest.mocked(getAccessibleRegionIdsForUser)
const dialect = new PgDialect()
const lastQuery = () => dialect.sqlToQuery(execute.mock.calls[execute.mock.calls.length - 1][0] as never)

beforeEach(() => {
  jest.clearAllMocks()
  execute.mockResolvedValue({ rows: [{ id: 1, nome: 'Bonito e Rio da Prata', municipio: 'Bonito', uf: 'MS', organizacao: 'IHP' }] } as never)
})

test('superadmin: todas as regiões, de qualquer organização, sem consultar os papéis', async () => {
  const list = await listAccessibleRegions('u', 'org', true)
  expect(list).toHaveLength(1)
  expect(allowed).not.toHaveBeenCalled()
  expect(lastQuery().sql).not.toContain('organization_id =')
})

test('dono da organização: todas as regiões dela, e só dela', async () => {
  allowed.mockResolvedValue(null)
  await listAccessibleRegions('u', 'org', false)
  const q = lastQuery()
  expect(q.sql).toContain('r.organization_id =')
  expect(q.sql).not.toContain('r.id IN')
  expect(q.params).toContain('org')
})

test('demais: só as regiões dos papéis, dentro da organização', async () => {
  allowed.mockResolvedValue([1, 3])
  await listAccessibleRegions('u', 'org', false)
  const q = lastQuery()
  expect(q.sql).toContain('r.organization_id =')
  expect(q.sql).toContain('r.id IN')
  expect(q.params).toEqual(expect.arrayContaining(['org', 1, 3]))
})

test('sem nenhuma região permitida: lista vazia, sem consultar as regiões', async () => {
  allowed.mockResolvedValue([])
  expect(await listAccessibleRegions('u', 'org', false)).toEqual([])
  expect(execute).not.toHaveBeenCalled()
})
