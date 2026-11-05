import { layerDeletability } from '../layer-delete'
import { removeLayerFromLayout, type MapLayout } from '@/components/map/helpers/layer-layout'

describe('quais camadas se excluem', () => {
  it('as enviadas e as importadas, sim', () => {
    expect(layerDeletability({ slug: 'nova-camada-11032026', scope: 'region', tenantId: 'org', schemaConfig: { source: 'upload' } })).toEqual({ ok: true })
    expect(layerDeletability({ slug: 'uso-do-solo-mapbiomas-9971h', scope: 'tenant', schemaConfig: { source: 'drop-import', kind: 'raster' } })).toEqual({ ok: true })
  })

  it('a que mostra registros do sistema, não (excluir "tudo o que é dela" apagaria as ações)', () => {
    const r = layerDeletability({ slug: 'acoes', scope: 'region', tenantId: 'org', schemaConfig: { sourceType: 'table' } })
    expect(r.ok).toBe(false)
    expect(!r.ok && r.reason).toContain('registros do sistema')
  })

  it('a que outra tela usa pelo nome, não, e diz qual tela', () => {
    const r = layerDeletability({ slug: 'deque-de-pedras', scope: 'region', tenantId: 'org' })
    expect(!r.ok && r.reason).toMatch(/^A Situação usa esta camada/)
    expect(layerDeletability({ slug: 'banhado', scope: 'region' }).ok).toBe(false)
  })

  it('a global, não', () => {
    expect(layerDeletability({ slug: 'limites', scope: 'global' }).ok).toBe(false)
    expect(layerDeletability({ slug: 'limites', scope: 'region', tenantId: null }).ok).toBe(false)
  })
})

describe('tirar a camada excluída do layout de cada pessoa', () => {
  const layout: MapLayout = {
    v: 1,
    items: [
      { kind: 'layer', slug: 'rios' },
      { kind: 'folder', id: 'f', name: 'Uploads', open: true, remembered: ['rios', 'apps'], layers: [{ slug: 'apps' }, { slug: 'rios', color: '#112233' }] },
      { kind: 'layer', slug: 'nascentes' },
    ],
  }

  it('sai de onde estiver: solta, dentro da pasta e da memória do interruptor', () => {
    const next = removeLayerFromLayout(layout, 'rios')
    expect(next.items.map((i) => (i.kind === 'folder' ? i.id : i.slug))).toEqual(['f', 'nascentes'])
    const folder = next.items[0] as Extract<MapLayout['items'][number], { kind: 'folder' }>
    expect(folder.layers.map((l) => l.slug)).toEqual(['apps'])
    expect(folder.remembered).toEqual(['apps'])
  })

  it('sem a camada, devolve o mesmo layout (nada a gravar)', () => {
    expect(removeLayerFromLayout(layout, 'outra')).toBe(layout)
  })
})
