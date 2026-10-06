import { NextRequest, NextResponse } from 'next/server'
import { GET } from './route'
import { resolveScope } from '@/lib/api/scope'
import { queryNovidades } from '@/lib/repositories/mapNovidadesRepository'

jest.mock('@/lib/api/scope', () => ({ resolveScope: jest.fn() }))
jest.mock('@/lib/repositories/mapNovidadesRepository', () => ({ queryNovidades: jest.fn() }))
const scope = jest.mocked(resolveScope)
const query = jest.mocked(queryNovidades)
const request = (params: string) => new NextRequest(`http://localhost/api/map/novidades?${params}`)
const empty = { count: 0, ids: [] }
beforeEach(() => {
  jest.clearAllMocks()
  scope.mockResolvedValue({ tenantId: 'org', regiaoId: 7, user: {} as never, response: null })
  query.mockResolvedValue({ now: '2026-10-06T12:00:00.000Z', acoesMaxId: 10, focos: empty, desmatamento: empty, acoes: empty })
})

test('usa o escopo autorizado da região e repassa o ponto de partida', async () => {
  const res = await GET(request('regiao_id=7&since=2026-10-01T00:00:00.000Z&acoes_after=5'))
  expect(res.status).toBe(200)
  expect(scope).toHaveBeenCalledWith({ regiaoId: 7 })
  expect(query).toHaveBeenCalledWith('org', 7, expect.objectContaining({ regiao_id: 7, acoes_after: 5 }))
})

test('primeira visita: sem ponto de partida também é uma consulta válida', async () => {
  expect((await GET(request('regiao_id=7'))).status).toBe(200)
})

test('sem região na URL vale a do usuário (o escopo resolve)', async () => {
  expect((await GET(request(''))).status).toBe(200)
  expect(scope).toHaveBeenCalledWith({ regiaoId: undefined })
})

test('não consulta uma região negada', async () => {
  scope.mockResolvedValue({ tenantId: null, regiaoId: null, user: null, response: NextResponse.json({}, { status: 403 }) })
  expect((await GET(request('regiao_id=2'))).status).toBe(403)
  expect(query).not.toHaveBeenCalled()
})

test.each(['regiao_id=0', 'regiao_id=7abc', 'regiao_id=7&since=ontem', 'regiao_id=7&acoes_after=-1'])('rejeita consulta inválida: %s', async (params) => {
  expect((await GET(request(params))).status).toBe(400)
  expect(query).not.toHaveBeenCalled()
})

test('erro inesperado vira 500 sem vazar o detalhe', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
  query.mockRejectedValue(new Error('connection refused'))
  const res = await GET(request('regiao_id=7'))
  expect(res.status).toBe(500)
  expect(JSON.stringify(await res.json())).not.toContain('connection refused')
})
