import { GET as assuntos } from './assuntos/route'
import { GET as desmatamentoCamada } from './desmatamento-camada/route'
import { resolveEnvironmentalReadScope } from '@/lib/api/environmental-read-scope'
import { apiError } from '@/lib/api/responses'
import { lerAlertasDaCamada, lerFontesDaRegiao } from '@/lib/repositories/situacaoFontesRepository'
import { findLayerEntryBySlug } from '@/lib/repositories/layerRepository'

jest.mock('@/lib/api/environmental-read-scope', () => ({ resolveEnvironmentalReadScope: jest.fn() }))
jest.mock('@/lib/repositories/situacaoFontesRepository', () => ({ lerFontesDaRegiao: jest.fn(), lerAlertasDaCamada: jest.fn() }))
jest.mock('@/lib/repositories/layerRepository', () => ({ findLayerEntryBySlug: jest.fn() }))

const scope = jest.mocked(resolveEnvironmentalReadScope)
const fontes = jest.mocked(lerFontesDaRegiao)
const alertas = jest.mocked(lerAlertasDaCamada)
const find = jest.mocked(findLayerEntryBySlug)
const nada = { focos: false, desmatamento: false, javali: false, formoso: false, prata: false, cure: false }
const req = (path: string) => new Request(`http://localhost${path}`)
const camada = { id: 9, slug: 'desmatamento-mapbiomas-dgd66', name: 'Desmatamento Mapbiomas', regiaoId: 2, schemaConfig: { source: 'drop-import' } }

beforeEach(() => {
  jest.resetAllMocks()
  scope.mockResolvedValue({ response: null, tenantId: 'org-b', isSuperadmin: false, regionFilter: 2 } as never)
  find.mockResolvedValue(camada as never)
})

describe('GET /api/situacao/assuntos', () => {
  it('diz os assuntos da região pelo catálogo e pelo que há no banco', async () => {
    fontes.mockResolvedValue({ catalogo: [{ slug: camada.slug, name: camada.name, schemaConfig: camada.schemaConfig }], presenca: nada })
    const res = await assuntos(req('/api/situacao/assuntos?regiao_id=2'))
    expect(res.status).toBe(200)
    expect(fontes).toHaveBeenCalledWith(2)
    const { data } = await res.json()
    expect(data).toMatchObject({ focos: false, desmatamento: { tipo: 'camada', slug: camada.slug }, prata: false })
  })

  it('sem região não responde (misturaria as regiões da pessoa)', async () => {
    expect((await assuntos(req('/api/situacao/assuntos'))).status).toBe(400)
    expect(fontes).not.toHaveBeenCalled()
  })

  it('região que a pessoa não acessa: a recusa do escopo passa adiante', async () => {
    scope.mockResolvedValue({ response: apiError('Região não acessível.', 403) } as never)
    expect((await assuntos(req('/api/situacao/assuntos?regiao_id=1'))).status).toBe(403)
    expect(fontes).not.toHaveBeenCalled()
  })

  it('região inexistente responde 404', async () => {
    fontes.mockResolvedValue(null)
    expect((await assuntos(req('/api/situacao/assuntos?regiao_id=2'))).status).toBe(404)
  })
})

describe('GET /api/situacao/desmatamento-camada', () => {
  it('soma os alertas da camada por ano e mês', async () => {
    alertas.mockResolvedValue([{ properties: { area_ha: 10, data_deteccao: '2025-02-01' }, haGeom: 9 }])
    const res = await desmatamentoCamada(req(`/api/situacao/desmatamento-camada?regiao_id=2&slug=${camada.slug}`))
    expect(res.status).toBe(200)
    expect((await res.json()).data).toEqual({ 2025: [0, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] })
  })

  it('não lê camada de outra região', async () => {
    find.mockResolvedValue({ ...camada, regiaoId: 1 } as never)
    expect((await desmatamentoCamada(req(`/api/situacao/desmatamento-camada?regiao_id=2&slug=${camada.slug}`))).status).toBe(404)
    expect(alertas).not.toHaveBeenCalled()
  })

  it('não serve para ler uma camada qualquer da região', async () => {
    find.mockResolvedValue({ ...camada, slug: 'rede-amolar', name: 'Rede Amolar' } as never)
    expect((await desmatamentoCamada(req('/api/situacao/desmatamento-camada?regiao_id=2&slug=rede-amolar'))).status).toBe(404)
    expect(alertas).not.toHaveBeenCalled()
  })

  it('sem camada ou sem região, recusa', async () => {
    expect((await desmatamentoCamada(req('/api/situacao/desmatamento-camada?regiao_id=2'))).status).toBe(400)
    expect((await desmatamentoCamada(req(`/api/situacao/desmatamento-camada?slug=${camada.slug}`))).status).toBe(400)
  })
})
