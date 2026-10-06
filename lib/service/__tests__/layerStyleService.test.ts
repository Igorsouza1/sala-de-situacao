jest.mock('@/lib/repositories/layerRepository', () => ({ findLayerEntryBySlug: jest.fn(), updateLayerEntry: jest.fn() }))
import { findLayerEntryBySlug, updateLayerEntry } from '@/lib/repositories/layerRepository'
import { LayerEditError, layerEditSchema, updateLayerEdit } from '../layerStyleService'
import { readEdit } from '@/lib/layer-style'

const ORG_A = 'org-a'
const propriedades = {
  id: 7,
  slug: 'propriedades',
  name: 'Propriedades',
  scope: 'region',
  tenantId: ORG_A,
  visualConfig: {
    category: 'Base Territorial',
    baseStyle: { type: 'polygon', color: '#000000', weight: 3, opacity: 1, fillColor: '#22c55e', fillOpacity: 0.2 },
    maplibre: { type: 'fill', paint: { 'fill-color': '#32a852', 'fill-opacity': 0.2 } },
    popupFields: [{ key: 'nome', label: 'Nome' }],
  },
}
const edit = (over: Record<string, unknown> = {}) => ({ ...readEdit(propriedades), name: 'Propriedades rurais', ...over })

beforeEach(() => {
  jest.resetAllMocks()
  ;(findLayerEntryBySlug as jest.Mock).mockResolvedValue(propriedades)
  ;(updateLayerEntry as jest.Mock).mockResolvedValue({ id: 7 })
})

describe('layerEditSchema', () => {
  it('tira os espaços das pontas do nome e aceita uma edição completa', () => {
    const parsed = layerEditSchema.parse({ ...edit(), name: '  Municipio de Bonito  ' })
    expect(parsed.name).toBe('Municipio de Bonito')
  })

  it.each([
    ['nome vazio', { name: '   ' }],
    ['cor que não é hex', { style: { ...edit().style, color: 'red' } }],
    ['transparência fora de 0 a 1', { style: { ...edit().style, fillOpacity: 1.5 } }],
    ['espessura absurda', { style: { ...edit().style, weight: 500 } }],
    ['seção que não existe', { category: 'Outra' }],
    ['ícone com caractere perigoso', { style: { ...edit().style, iconName: '../x' } }],
  ])('recusa %s', (_nome, over) => {
    expect(layerEditSchema.safeParse(edit(over)).success).toBe(false)
  })
})

describe('updateLayerEdit', () => {
  it('owner da organização dona grava; o resto do JSON passa intacto', async () => {
    const next = edit({ style: { ...edit().style, fillColor: '#c8431a' } })
    const out = await updateLayerEdit('propriedades', next as any, { tenantId: ORG_A, isSuperadmin: false })
    const [id, patch] = (updateLayerEntry as jest.Mock).mock.calls[0]
    expect(id).toBe(7)
    expect(patch.name).toBe('Propriedades rurais')
    expect(patch.visualConfig.maplibre.paint['fill-color']).toBe('#c8431a')
    expect(patch.visualConfig.baseStyle.fillColor).toBe('#c8431a')
    expect(patch.visualConfig.popupFields).toEqual(propriedades.visualConfig.popupFields)
    expect(out.slug).toBe('propriedades') // o slug nunca muda
  })

  it('camada de outra organização é como se não existisse (404) e nada é gravado', async () => {
    await expect(updateLayerEdit('propriedades', edit() as any, { tenantId: 'org-b', isSuperadmin: false })).rejects.toMatchObject({ status: 404 })
    expect(updateLayerEntry).not.toHaveBeenCalled()
  })

  it('camada global só o superadmin edita (403 para o owner, ok para o superadmin)', async () => {
    ;(findLayerEntryBySlug as jest.Mock).mockResolvedValue({ ...propriedades, tenantId: null, scope: 'global' })
    await expect(updateLayerEdit('propriedades', edit() as any, { tenantId: ORG_A, isSuperadmin: false })).rejects.toMatchObject({ status: 403 })
    expect(updateLayerEntry).not.toHaveBeenCalled()
    await expect(updateLayerEdit('propriedades', edit() as any, { tenantId: ORG_A, isSuperadmin: true })).resolves.toBeTruthy()
  })

  it('o superadmin edita camada de qualquer organização', async () => {
    await expect(updateLayerEdit('propriedades', edit() as any, { tenantId: 'org-b', isSuperadmin: true })).resolves.toBeTruthy()
  })

  it('camada que não existe dá 404', async () => {
    ;(findLayerEntryBySlug as jest.Mock).mockResolvedValue(undefined)
    await expect(updateLayerEdit('nada', edit() as any, { tenantId: ORG_A, isSuperadmin: false })).rejects.toBeInstanceOf(LayerEditError)
  })

  it('não troca o tipo de uma camada que tem tipo explícito (polígono não vira linha)', async () => {
    const asLine = edit({ style: { ...edit().style, shape: 'line' } })
    await expect(updateLayerEdit('propriedades', asLine as any, { tenantId: ORG_A, isSuperadmin: false })).rejects.toMatchObject({ status: 400 })
    expect(updateLayerEntry).not.toHaveBeenCalled()
  })

  describe('ícone por área', () => {
    const acoes = {
      ...propriedades,
      slug: 'acoes',
      visualConfig: {
        category: 'Operacional',
        baseStyle: { type: 'icon', color: '#64748b', iconName: 'map-pin' },
        rules: [{ field: 'eixo_tematico', styleProperty: 'iconName', values: { Vegetação: 'sprout', Monitoramento: 'activity' } }],
      },
    }

    it('grava o ícone de uma área na regra por valor e mantém as outras', async () => {
      ;(findLayerEntryBySlug as jest.Mock).mockResolvedValue(acoes)
      const next = { ...readEdit(acoes), ruleIcons: { Vegetação: 'trees' } }
      await updateLayerEdit('acoes', next as any, { tenantId: ORG_A, isSuperadmin: false })
      const patch = (updateLayerEntry as jest.Mock).mock.calls[0][1]
      expect(patch.visualConfig.rules[0].values).toEqual({ Vegetação: 'trees', Monitoramento: 'activity' })
    })

    it('recusa ícone por área numa camada sem regra (seria gravado e nunca lido)', async () => {
      await expect(updateLayerEdit('propriedades', { ...edit(), ruleIcons: { x: 'trees' } } as any, { tenantId: ORG_A, isSuperadmin: false })).rejects.toMatchObject({ status: 400 })
      expect(updateLayerEntry).not.toHaveBeenCalled()
    })

    it('o esquema recusa nome de ícone com caractere perigoso e chave vazia', () => {
      expect(layerEditSchema.safeParse({ ...edit(), ruleIcons: { Vegetação: '../x' } }).success).toBe(false)
      expect(layerEditSchema.safeParse({ ...edit(), ruleIcons: { '  ': 'trees' } }).success).toBe(false)
      expect(layerEditSchema.safeParse({ ...edit(), ruleIcons: { Vegetação: 'trees' } }).success).toBe(true)
    })
  })

  it('camada sem tipo explícito aceita o tipo que o editor viu nos dados (geometria)', async () => {
    ;(findLayerEntryBySlug as jest.Mock).mockResolvedValue({ ...propriedades, visualConfig: { category: 'Monitoramento' } })
    const asCircle = edit({ style: { ...edit().style, shape: 'circle' } })
    await expect(updateLayerEdit('propriedades', asCircle as any, { tenantId: ORG_A, isSuperadmin: false })).resolves.toBeTruthy()
  })
})
