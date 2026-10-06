import { NextRequest, NextResponse } from 'next/server'
import { GET } from './route'
import { resolveScope } from '@/lib/api/scope'
import { queryLinhaDoTempo } from '@/lib/repositories/mapLinhaDoTempoRepository'

jest.mock('@/lib/api/scope', () => ({ resolveScope: jest.fn() }))
jest.mock('@/lib/repositories/mapLinhaDoTempoRepository', () => ({ queryLinhaDoTempo: jest.fn() }))
const scope = jest.mocked(resolveScope)
const query = jest.mocked(queryLinhaDoTempo)
const request = (params: string) => new NextRequest(`http://localhost/api/map/linha-do-tempo?${params}`)
beforeEach(() => {
  jest.clearAllMocks()
  scope.mockResolvedValue({ tenantId: 'org', regiaoId: 7, user: {} as never, response: null })
  query.mockResolvedValue({ focos: [{ mes: '2026-03', n: 4 }], desmatamento: [], acoes: [] })
})

test('usa o escopo autorizado da região', async () => {
  const res = await GET(request('regiao_id=7'))
  expect(res.status).toBe(200)
  expect(scope).toHaveBeenCalledWith({ regiaoId: 7 })
  expect(query).toHaveBeenCalledWith('org', 7)
  expect((await res.json()).focos).toEqual([{ mes: '2026-03', n: 4 }])
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

test.each(['regiao_id=0', 'regiao_id=7abc', 'regiao_id=-1'])('rejeita consulta inválida: %s', async (params) => {
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
