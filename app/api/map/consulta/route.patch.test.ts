import { NextRequest, NextResponse } from 'next/server'
import { PATCH } from './route'
import { resolveScope } from '@/lib/api/scope'
import { requireWriteRegion } from '@/lib/api/require-write-region'
import { queryMapConsulta, updateMapConsultaItem } from '@/lib/repositories/mapConsultaRepository'

jest.mock('@/lib/api/scope', () => ({ resolveScope: jest.fn() }))
jest.mock('@/lib/api/require-write-region', () => ({ requireWriteRegion: jest.fn() }))
jest.mock('@/lib/repositories/mapConsultaRepository', () => ({ queryMapConsulta: jest.fn(), updateMapConsultaItem: jest.fn() }))
jest.mock('@/lib/service/acoesService', () => ({ addAcaoUpdate: jest.fn().mockResolvedValue(undefined) }))
jest.mock('next/cache', () => ({ revalidateTag: jest.fn() }))

const scope = jest.mocked(resolveScope)
const write = jest.mocked(requireWriteRegion)
const update = jest.mocked(updateMapConsultaItem)
const query = jest.mocked(queryMapConsulta)
const user = (superadmin = false) => ({ id: 'u', app_metadata: { is_superadmin: superadmin } }) as never
const patch = (body: unknown) => new NextRequest('http://localhost/api/map/consulta', { method: 'PATCH', body: JSON.stringify(body) })
const acao = { kind: 'acoes', id: 5, regiao_id: 1, fields: { nome: ' Aceiro ', descricao: '' } }

beforeEach(() => {
  jest.clearAllMocks()
  scope.mockResolvedValue({ tenantId: 'org', regiaoId: 1, user: user(), response: null })
  write.mockResolvedValue({ regionId: 1, tenantId: 'org', response: null })
  update.mockResolvedValue({ previous: { nome: 'Antes', descricao: 'x' } })
  query.mockResolvedValue({ items: [{ id: 5, nome: 'Aceiro' } as never], hasMore: false })
})

test('salva só os campos descritivos, limpa o vazio e devolve o que havia antes', async () => {
  const response = await PATCH(patch(acao))
  expect(response.status).toBe(200)
  expect(update).toHaveBeenCalledWith('org', 1, { kind: 'acoes', id: 5, fields: { nome: 'Aceiro', descricao: null } })
  expect(await response.json()).toEqual({ item: { id: 5, nome: 'Aceiro' }, previous: { nome: 'Antes', descricao: 'x' } })
})

test('Viewer e Auditor (sem escrita na Região) não gravam', async () => {
  write.mockResolvedValue({ regionId: 1, tenantId: 'org', response: NextResponse.json({}, { status: 403 }) })
  expect((await PATCH(patch(acao))).status).toBe(403)
  expect(update).not.toHaveBeenCalled()
})

test('Região negada não grava', async () => {
  scope.mockResolvedValue({ tenantId: null, regiaoId: null, user: null, response: NextResponse.json({}, { status: 403 }) })
  expect((await PATCH(patch(acao))).status).toBe(403)
  expect(update).not.toHaveBeenCalled()
})

test.each([
  ['campo fora da lista (geometria)', { kind: 'acoes', id: 5, regiao_id: 1, fields: { geom: 'x' } }],
  ['status inventado', { kind: 'acoes', id: 5, regiao_id: 1, fields: { status: 'Cancelado' } }],
  ['nome vazio', { kind: 'acoes', id: 5, regiao_id: 1, fields: { nome: '   ' } }],
  ['nenhum campo', { kind: 'acoes', id: 5, regiao_id: 1, fields: {} }],
  ['sem Região', { kind: 'acoes', id: 5, fields: { nome: 'a' } }],
  ['id inválido', { kind: 'propriedades', id: -1, regiao_id: 1, fields: { nome: 'a' } }],
])('rejeita: %s', async (_name, body) => {
  expect((await PATCH(patch(body))).status).toBe(400)
  expect(update).not.toHaveBeenCalled()
})

test('só o Superadmin altera o CAR', async () => {
  const body = { kind: 'propriedades', id: 9, regiao_id: 1, fields: { car: 'MS-123' } }
  expect((await PATCH(patch(body))).status).toBe(403)
  expect(update).not.toHaveBeenCalled()
  scope.mockResolvedValue({ tenantId: 'org', regiaoId: 1, user: user(true), response: null })
  update.mockResolvedValue({ previous: { car: 'MS-1' } })
  expect((await PATCH(patch(body))).status).toBe(200)
})

test('Editor altera o nome da propriedade sem tocar no CAR', async () => {
  update.mockResolvedValue({ previous: { nome: 'Antes' } })
  const response = await PATCH(patch({ kind: 'propriedades', id: 9, regiao_id: 1, fields: { nome: 'Santa Clara', titular: 'Maria' } }))
  expect(response.status).toBe(200)
  expect(update).toHaveBeenCalledWith('org', 1, { kind: 'propriedades', id: 9, fields: { nome: 'Santa Clara', titular: 'Maria' } })
})

test('registro fora da Região responde 404', async () => {
  update.mockResolvedValue(null)
  expect((await PATCH(patch(acao))).status).toBe(404)
})
