jest.mock('@/lib/api/require-auth', () => ({ requireRole: jest.fn(), requireAuthWithTenant: jest.fn() }))
jest.mock('@/db', () => ({ db: {} }))
jest.mock('@/lib/service/layerStyleService', () => {
  const actual = jest.requireActual('@/lib/service/layerStyleService')
  return { ...actual, updateLayerEdit: jest.fn() }
})
import { PUT } from './route'
import { requireRole } from '@/lib/api/require-auth'
import { LayerEditError, updateLayerEdit } from '@/lib/service/layerStyleService'

const ctx = { params: Promise.resolve({ slug: 'propriedades' }) }
const body = {
  name: 'Propriedades',
  category: 'Base Territorial',
  defaultVisibility: true,
  style: { shape: 'fill', color: '#000000', fillColor: '#32a852', fillOpacity: 0.2, opacity: 1, weight: 1.5, radius: 6 },
}
const req = (b: unknown) => new Request('http://localhost/api/admin/layer-catalog/propriedades', { method: 'PUT', body: JSON.stringify(b) }) as any

beforeEach(() => {
  jest.resetAllMocks()
  ;(requireRole as jest.Mock).mockResolvedValue({ user: { id: 'u1', app_metadata: {} }, tenantId: 'org-a', response: null })
  ;(updateLayerEdit as jest.Mock).mockResolvedValue({ slug: 'propriedades', name: 'Propriedades', visualConfig: {} })
})

describe('PUT /api/admin/layer-catalog/[slug]', () => {
  it('exige papel owner: quem não passa não chega a gravar', async () => {
    ;(requireRole as jest.Mock).mockResolvedValue({ user: null, tenantId: null, response: new Response(null, { status: 403 }) })
    const res = await PUT(req(body), ctx)
    expect(requireRole).toHaveBeenCalledWith('owner')
    expect(res.status).toBe(403)
    expect(updateLayerEdit).not.toHaveBeenCalled()
  })

  it('recusa corpo inválido com a primeira mensagem, em português, sem gravar', async () => {
    const res = await PUT(req({ ...body, name: '   ' }), ctx)
    expect(res.status).toBe(400)
    expect((await res.json()).error.message).toBe('O nome não pode ficar vazio.')
    expect(updateLayerEdit).not.toHaveBeenCalled()
  })

  it('passa o papel de superadmin e a organização ao serviço', async () => {
    ;(requireRole as jest.Mock).mockResolvedValue({ user: { id: 'u1', app_metadata: { is_superadmin: true } }, tenantId: 'org-a', response: null })
    const res = await PUT(req(body), ctx)
    expect(res.status).toBe(200)
    expect(updateLayerEdit).toHaveBeenCalledWith('propriedades', expect.objectContaining({ name: 'Propriedades' }), { tenantId: 'org-a', isSuperadmin: true })
  })

  it('traduz os erros do serviço em respostas (404 e 403)', async () => {
    ;(updateLayerEdit as jest.Mock).mockRejectedValue(new LayerEditError(404, 'Camada não encontrada.'))
    expect((await PUT(req(body), ctx)).status).toBe(404)
    ;(updateLayerEdit as jest.Mock).mockRejectedValue(new LayerEditError(403, 'Só o superadmin edita camadas globais.'))
    expect((await PUT(req(body), ctx)).status).toBe(403)
  })

  it('erro inesperado vira 500 sem vazar o detalhe', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
    ;(updateLayerEdit as jest.Mock).mockRejectedValue(new Error('connection refused'))
    const res = await PUT(req(body), ctx)
    expect(res.status).toBe(500)
    expect(JSON.stringify(await res.json())).not.toContain('connection refused')
  })
})
