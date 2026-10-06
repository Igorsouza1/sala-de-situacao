import { getLayerLegendInfo } from '../helpers/legend'

describe('getLayerLegendInfo', () => {
  it('ponto com borda branca: miolo azul e borda branca, não tudo branco', () => {
    const info = getLayerLegendInfo({
      baseStyle: { type: 'circle', color: '#ffffff', fillColor: '#0ea5e9' },
      maplibre: { type: 'circle', paint: { 'circle-color': '#0ea5e9', 'circle-stroke-color': '#ffffff', 'circle-stroke-width': 1.5 } },
    })
    expect(info).toMatchObject({ legendType: 'circle', fillColor: '#0ea5e9', color: '#ffffff' })
  })

  it('polígono com maplibre: a legenda mostra a cor que o mapa desenha', () => {
    const info = getLayerLegendInfo({
      baseStyle: { type: 'polygon', color: '#000000', fillColor: '#22c55e', fillOpacity: 0.2 },
      maplibre: { type: 'fill', paint: { 'fill-color': '#32a852', 'fill-opacity': 0.2 } },
    })
    expect(info).toMatchObject({ legendType: 'polygon', fillColor: '#32a852', fillOpacity: 0.2 })
  })

  it('preenchimento zero continua zero (só o contorno)', () => {
    expect(getLayerLegendInfo({ baseStyle: { type: 'polygon', color: '#2563eb', fillColor: '#3b82f6', fillOpacity: 0 } }).fillOpacity).toBe(0)
  })

  it('tipos: linha, ícone e, sem tipo mas com ícone, marcador', () => {
    expect(getLayerLegendInfo({ baseStyle: { type: 'line', color: '#fef3c7' } }).legendType).toBe('line')
    expect(getLayerLegendInfo({ baseStyle: { type: 'icon', color: '#64748b', iconName: 'map-pin' } })).toMatchObject({ legendType: 'icon', iconName: 'map-pin' })
    expect(getLayerLegendInfo({ iconName: 'waves' }).legendType).toBe('icon')
    expect(getLayerLegendInfo(null).legendType).toBe('polygon')
  })
})
