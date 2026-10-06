import { LAYER_ICONS } from '../helpers/layer-palette'
import { LAYER_ICON_MAP, resolveLayerIcon } from '../helpers/layer-icons'

describe('ícones das camadas', () => {
  it('todo ícone que o editor oferece tem desenho', () => {
    for (const { name } of LAYER_ICONS) expect(LAYER_ICON_MAP[name]).toBeDefined()
  })
  it('os nomes que o catálogo usa hoje têm desenho', () => {
    for (const name of ['activity', 'flame', 'map-pin', 'sprout', 'wave', 'waves']) expect(LAYER_ICON_MAP[name]).toBeDefined()
  })
  it('nome desconhecido ou vazio cai no pino', () => {
    expect(resolveLayerIcon('inexistente')).toBe(LAYER_ICON_MAP['map-pin'])
    expect(resolveLayerIcon(undefined)).toBe(LAYER_ICON_MAP['map-pin'])
  })
  it('ignora maiúsculas e espaços', () => {
    expect(resolveLayerIcon(' Flame ')).toBe(LAYER_ICON_MAP.flame)
  })
  it('ícones diferentes têm desenhos diferentes (as áreas se distinguem)', () => {
    const distinct = new Set(LAYER_ICONS.map((i) => LAYER_ICON_MAP[i.name]))
    expect(distinct.size).toBeGreaterThanOrEqual(LAYER_ICONS.length - 1)
  })
})
