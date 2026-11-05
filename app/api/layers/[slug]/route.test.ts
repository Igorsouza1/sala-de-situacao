import { NextRequest } from 'next/server'
import { revalidateTag } from 'next/cache'
import { DELETE } from './route'
import { requireAuthWithTenant } from '@/lib/api/require-auth'
import { requireWriteRegion } from '@/lib/api/require-write-region'
import { apiError } from '@/lib/api/responses'
import { findLayerEntryBySlug } from '@/lib/repositories/layerRepository'
import { deleteLayerEverywhere } from '@/lib/repositories/layerDeleteRepository'

jest.mock('@/lib/api/require-auth', () => ({ requireAuthWithTenant: jest.fn() }))
jest.mock('@/lib/api/require-write-region', () => ({ requireWriteRegion: jest.fn() }))
jest.mock('@/lib/repositories/layerRepository', () => ({ findLayerEntryBySlug: jest.fn() }))
jest.mock('@/lib/repositories/layerDeleteRepository', () => ({ deleteLayerEverywhere: jest.fn() }))
jest.mock('next/cache', () => ({ revalidateTag: jest.fn() }))

const auth = jest.mocked(requireAuthWithTenant)
const write = jest.mocked(requireWriteRegion)
const find = jest.mocked(findLayerEntryBySlug)
const remove = jest.mocked(deleteLayerEverywhere)
const user = (superadmin = false) => ({ id: 'u', app_metadata: { is_superadmin: superadmin } }) as never
const call = (slug: string) => DELETE(new NextRequest(`http://localhost/api/layers/${slug}`, { method: 'DELETE' }), { params: Promise.resolve({ slug }) })
const fogo = { id: 42, slug: 'fogo-mensal', tenantId: 'org', regiaoId: 2, scope: 'region', schemaConfig: { source: 'drop-import', kind: 'raster' } }

beforeEach(() => {
  jest.clearAllMocks()
  auth.mockResolvedValue({ user: user(), tenantId: 'org', response: null })
  write.mockResolvedValue({ regionId: 2, tenantId: 'org', response: null } as never)
  find.mockResolvedValue(fogo as never)
  remove.mockResolvedValue({ features: 0, layouts: 3 })
})

test('quem escreve na região exclui a camada e tudo dela, e o catálogo da região é relido', async () => {
  const res = await call('fogo-mensal')
  expect(res.status).toBe(200)
  expect(write).toHaveBeenCalledWith(expect.anything(), 'org', '2')
  expect(remove).toHaveBeenCalledWith({ id: 42, slug: 'fogo-mensal' })
  expect(revalidateTag).toHaveBeenCalledWith('layerCatalog-2', { expire: 0 })
  expect((await res.json()).data).toEqual({ slug: 'fogo-mensal', features: 0, layouts: 3 })
})

test('sem escrita na região (Viewer, Auditor) não exclui', async () => {
  write.mockResolvedValue({ regionId: 2, tenantId: 'org', response: apiError('Sem permissao de escrita nesta regiao.', 403) } as never)
  const res = await call('fogo-mensal')
  expect(res.status).toBe(403)
  expect((await res.json()).error.message).toMatch(/Seu perfil não pode excluir/)
  expect(remove).not.toHaveBeenCalled()
})

test('camada de outra organização não existe para quem não é dela', async () => {
  find.mockResolvedValue({ ...fogo, tenantId: 'outra' } as never)
  expect((await call('fogo-mensal')).status).toBe(404)
  expect(remove).not.toHaveBeenCalled()
})

test('camada inexistente responde 404', async () => {
  find.mockResolvedValue(undefined as never)
  expect((await call('nada')).status).toBe(404)
})

test.each([
  ['registros do sistema (Ações)', { ...fogo, slug: 'acoes', schemaConfig: { sourceType: 'table' } }],
  ['usada pela Situação', { ...fogo, slug: 'deque-de-pedras', schemaConfig: {} }],
  ['de todas as organizações', { ...fogo, scope: 'global' }],
])('a regra vale também no servidor: %s', async (_name, layer) => {
  find.mockResolvedValue(layer as never)
  expect((await call(layer.slug)).status).toBe(403)
  expect(remove).not.toHaveBeenCalled()
})

test('camada da organização inteira (sem região) só a administração remove', async () => {
  find.mockResolvedValue({ ...fogo, regiaoId: null, scope: 'tenant' } as never)
  expect((await call('fogo-mensal')).status).toBe(403)
  expect(remove).not.toHaveBeenCalled()
})

test('o superadmin exclui de qualquer organização, sem a conferência de região', async () => {
  auth.mockResolvedValue({ user: user(true), tenantId: 'org', response: null })
  find.mockResolvedValue({ ...fogo, tenantId: 'outra' } as never)
  expect((await call('fogo-mensal')).status).toBe(200)
  expect(write).not.toHaveBeenCalled()
  expect(remove).toHaveBeenCalled()
})

test('sem sessão não chega a procurar a camada', async () => {
  auth.mockResolvedValue({ user: null, tenantId: null, response: apiError('Não autorizado.', 401) })
  expect((await call('fogo-mensal')).status).toBe(401)
  expect(find).not.toHaveBeenCalled()
})

test('falha no banco responde 500 e não relê o catálogo', async () => {
  remove.mockRejectedValue(new Error('conexão caiu'))
  jest.spyOn(console, 'error').mockImplementation(() => {})
  expect((await call('fogo-mensal')).status).toBe(500)
  expect(revalidateTag).not.toHaveBeenCalled()
})
