import { NextRequest, NextResponse } from 'next/server'
import { GET } from './route'
import { resolveScope } from '@/lib/api/scope'
import { queryMapConsulta } from '@/lib/repositories/mapConsultaRepository'

jest.mock('@/lib/api/scope', () => ({ resolveScope: jest.fn() }))
jest.mock('@/lib/repositories/mapConsultaRepository', () => ({ queryMapConsulta: jest.fn() }))
const scope = jest.mocked(resolveScope)
const query = jest.mocked(queryMapConsulta)
const request = (params: string) => new NextRequest(`http://localhost/api/map/consulta?${params}`)
beforeEach(() => {
  jest.clearAllMocks()
  scope.mockResolvedValue({ tenantId: 'org', regiaoId: 1, user: {} as never, response: null })
  query.mockResolvedValue({ items: [], hasMore: false })
})
test('usa o escopo autorizado, paginação explícita e busca normalizada', async () => {
  expect((await GET(request('regiao_id=1&kind=propriedades&q=%20Santa%20&offset=20'))).status).toBe(200)
  expect(scope).toHaveBeenCalledWith({ regiaoId: 1 })
  expect(query).toHaveBeenCalledWith('org', 1, expect.objectContaining({ kind: 'propriedades', q: 'Santa', offset: 20 }))
})
test('não consulta registros de uma Região negada', async () => {
  scope.mockResolvedValue({ tenantId: null, regiaoId: null, user: null, response: NextResponse.json({}, { status: 403 }) })
  expect((await GET(request('regiao_id=2&id=252'))).status).toBe(403)
  expect(query).not.toHaveBeenCalled()
})
test.each(['id=-1', 'regiao_id=1abc', 'kind=outro', 'offset=-1', 'bbox=1,2,0,3', 'bbox=,1,2,3,4'])('rejeita consulta inválida: %s', async params => {
  expect((await GET(request(params))).status).toBe(400)
  expect(query).not.toHaveBeenCalled()
})
test('não amplia o escopo quando não existe Região', async () => {
  scope.mockResolvedValue({ tenantId: 'org', regiaoId: null, user: {} as never, response: null })
  expect((await GET(request(''))).status).toBe(400)
  expect(query).not.toHaveBeenCalled()
})
test('detalhe ausente retorna 404, lista vazia retorna 200', async () => {
  expect((await GET(request('id=99'))).status).toBe(404)
  expect((await GET(request('q=inexistente'))).status).toBe(200)
})
