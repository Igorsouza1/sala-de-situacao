jest.mock('@/db', () => ({ db: { transaction: jest.fn() } }))
import { db } from '@/db'
import { PgDialect } from 'drizzle-orm/pg-core'
import { deleteLayerEverywhere } from '../layerDeleteRepository'

const execute = jest.fn()
const dialect = new PgDialect()
const statements = () => execute.mock.calls.map(([statement]) => dialect.sqlToQuery(statement))

const layout = (slugs: string[]) => ({
  v: 1,
  items: [
    { kind: 'folder', id: 'f1', name: 'Uploads', open: true, layers: slugs.map((slug) => ({ slug })) },
    { kind: 'layer', slug: 'rios' },
  ],
})

beforeEach(() => {
  jest.resetAllMocks()
  ;(db.transaction as jest.Mock).mockImplementation((callback) => callback({ execute }))
})

function answers(layouts: { user_id: string; regiao_id: number; layout: unknown }[]) {
  execute
    .mockResolvedValueOnce({ rowCount: 12 }) // DELETE layer_data
    .mockResolvedValueOnce({ rows: [{ n: 30 }] }) // COUNT layer_features
    .mockResolvedValueOnce({ rowCount: 1 }) // DELETE layer_catalog
    .mockResolvedValueOnce({ rows: layouts }) // SELECT user_map_layouts
    .mockResolvedValue({ rowCount: 1 }) // UPDATEs
}

test('apaga as feições enviadas, a linha do catálogo (que leva o resto em cascata) e a camada no layout de cada pessoa', async () => {
  answers([
    { user_id: 'a', regiao_id: 2, layout: layout(['fogo-mensal', 'uso']) },
    { user_id: 'b', regiao_id: 2, layout: layout(['fogo-mensal']) },
  ])
  expect(await deleteLayerEverywhere({ id: 42, slug: 'fogo-mensal' })).toEqual({ features: 42, layouts: 2 })
  expect(db.transaction).toHaveBeenCalledTimes(1)

  const q = statements()
  expect(q[0].sql).toContain('DELETE FROM monitoramento.layer_data')
  expect(q[0].params).toEqual([42])
  expect(q[2].sql).toContain('DELETE FROM monitoramento.layer_catalog')
  expect(q[2].params).toEqual([42])
  // o slug procurado como texto JSON, com aspas, para não casar com outro slug que o contenha
  expect(q[3].params).toEqual(['%"fogo-mensal"%'])

  const saved = q.slice(4).map((s) => ({ layout: JSON.parse(s.params[0] as string), user: s.params[1], regiao: s.params[2] }))
  expect(saved).toHaveLength(2)
  expect(saved[0].user).toBe('a')
  expect(saved[0].layout.items[0].layers).toEqual([{ slug: 'uso' }])
  expect(saved[1].layout.items[0].layers).toEqual([])
  expect(JSON.stringify(saved)).not.toContain('fogo-mensal')
})

test('o "_" do slug vale como letra no LIKE', async () => {
  answers([])
  await deleteLayerEverywhere({ id: 7, slug: 'uso_solo' })
  expect(statements()[3].params).toEqual(['%"uso\\_solo"%'])
})

test('layout que só parecia ter a camada (o LIKE achou o nome em outro lugar) não é regravado', async () => {
  answers([{ user_id: 'a', regiao_id: 2, layout: { v: 1, items: [{ kind: 'folder', id: 'f', name: 'fogo-mensal', open: true, layers: [] }] } }])
  expect(await deleteLayerEverywhere({ id: 42, slug: 'fogo-mensal' })).toEqual({ features: 42, layouts: 0 })
  expect(execute).toHaveBeenCalledTimes(4)
})

test('falha no meio desfaz tudo: o erro sobe e a transação não confirma', async () => {
  execute.mockResolvedValueOnce({ rowCount: 0 }).mockRejectedValueOnce(new Error('conexão caiu'))
  await expect(deleteLayerEverywhere({ id: 42, slug: 'fogo-mensal' })).rejects.toThrow('conexão caiu')
})
