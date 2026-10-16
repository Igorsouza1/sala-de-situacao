/**
 * /api/map/layout — a organização das camadas de cada pessoa.
 * Verifica que a rota só toca a linha do próprio usuário, descarta layout inválido e trata "sem região" como cache local, não como erro.
 */
jest.mock('@/db', () => ({ db: { execute: jest.fn() } }))
jest.mock('@/lib/api/scope', () => ({ resolveScope: jest.fn() }))

import { NextRequest } from 'next/server'
import { db } from '@/db'
import { resolveScope } from '@/lib/api/scope'
import { DELETE, GET, PUT } from '../route'

const USER = 'aaaaaaaa-0000-0000-0000-000000000001'
const execute = db.execute as jest.Mock
const scope = resolveScope as jest.Mock

const url = (qs = '') => `http://localhost/api/map/layout${qs}`
const get = (qs = '') => GET(new NextRequest(url(qs)))
const put = (body: unknown) => PUT(new NextRequest(url(), { method: 'PUT', body: JSON.stringify(body) }))
const del = (qs = '') => DELETE(new NextRequest(url(qs), { method: 'DELETE' }))

const layout = { v: 1, items: [{ kind: 'layer', slug: 'a', opacity: 0.5 }] }

beforeEach(() => {
  execute.mockReset()
  scope.mockReset()
  scope.mockResolvedValue({ user: { id: USER }, tenantId: 't', regiaoId: 7, response: null })
})

describe('GET', () => {
  it('devolve a resposta do escopo quando não há sessão', async () => {
    scope.mockResolvedValue({ user: null, tenantId: null, regiaoId: null, response: new Response(null, { status: 401 }) })
    expect((await get()).status).toBe(401)
    expect(execute).not.toHaveBeenCalled()
  })

  it('sem região na conta, "indisponível" não é erro: fica só no aparelho', async () => {
    scope.mockResolvedValue({ user: { id: USER }, tenantId: 't', regiaoId: null, response: null })
    const res = await get()
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ available: false, layout: null })
  })

  it('devolve o que a pessoa guardou, validado, e quando', async () => {
    execute.mockResolvedValue({ rows: [{ layout, updated_ms: '1700000000000' }] })
    const res = await get('?regiao_id=7')
    expect(await res.json()).toEqual({ available: true, layout, updatedAt: 1700000000000 })
    expect(scope).toHaveBeenCalledWith({ regiaoId: 7 })
  })

  it('nada guardado: layout nulo', async () => {
    execute.mockResolvedValue({ rows: [] })
    expect(await (await get()).json()).toEqual({ available: true, layout: null, updatedAt: null })
  })

  it('o que está no banco e não serve vira "nada guardado", não erro', async () => {
    execute.mockResolvedValue({ rows: [{ layout: { v: 9 }, updated_ms: '1' }] })
    expect(await (await get()).json()).toEqual({ available: true, layout: null, updatedAt: null })
  })

  it('região inválida: 400', async () => {
    expect((await get('?regiao_id=abc')).status).toBe(400)
  })
})

describe('PUT', () => {
  it('guarda a organização na linha do próprio usuário e devolve a hora da conta', async () => {
    execute.mockResolvedValue({ rows: [{ updated_ms: '1700000000123' }] })
    const res = await put({ regiao_id: 7, layout })
    expect(await res.json()).toEqual({ updatedAt: 1700000000123 })
    const query = JSON.stringify(execute.mock.calls[0][0])
    expect(query).toContain(USER)
    expect(query).toContain('user_map_layouts')
  })

  it('layout inválido: 400, e nada é gravado', async () => {
    expect((await put({ layout: { v: 2, items: [] } })).status).toBe(400)
    expect((await put({ layout: 'x' })).status).toBe(400)
    expect(execute).not.toHaveBeenCalled()
  })

  it('corpo que não é JSON: 400', async () => {
    const res = await PUT(new NextRequest(url(), { method: 'PUT', body: 'não é json' }))
    expect(res.status).toBe(400)
  })

  it('só grava o que passou pela validação (cor inválida cai fora)', async () => {
    execute.mockResolvedValue({ rows: [{ updated_ms: '1' }] })
    await put({ layout: { v: 1, items: [{ kind: 'layer', slug: 'a', color: 'vermelho' }] } })
    expect(JSON.stringify(execute.mock.calls[0][0])).not.toContain('vermelho')
  })

  it('sem região na conta: 400 pedindo a região', async () => {
    scope.mockResolvedValue({ user: { id: USER }, tenantId: 't', regiaoId: null, response: null })
    expect((await put({ layout })).status).toBe(400)
  })

  it('erro do banco: 500 com frase, sem detalhe técnico', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
    execute.mockRejectedValue(new Error('relation does not exist'))
    const res = await put({ layout })
    expect(res.status).toBe(500)
    expect(JSON.stringify(await res.json())).not.toContain('relation')
  })
})

describe('DELETE', () => {
  it('apaga só a linha do usuário nesta região', async () => {
    execute.mockResolvedValue({ rows: [] })
    expect((await del('?regiao_id=7')).status).toBe(200)
    expect(JSON.stringify(execute.mock.calls[0][0])).toContain(USER)
  })

  it('sem região na conta não há o que apagar', async () => {
    scope.mockResolvedValue({ user: { id: USER }, tenantId: 't', regiaoId: null, response: null })
    expect((await del()).status).toBe(200)
    expect(execute).not.toHaveBeenCalled()
  })
})
