import { mapKeyAction } from '../helpers/map-feel'
import { distanceLabel, metersPerPixel, niceDistance, scaleBar } from '../helpers/scale'

const key = (k: string, extra: Partial<Parameters<typeof mapKeyAction>[0]> = {}) => ({ key: k, shiftKey: false, ctrlKey: false, metaKey: false, altKey: false, defaultPrevented: false, ...extra })
const plain = { closest: () => null }
const inField = { closest: () => ({}) }

describe('mapKeyAction', () => {
  it('setas movem o mapa e Shift dobra o passo', () => {
    expect(mapKeyAction(key('ArrowLeft'), plain)).toEqual({ type: 'pan', dx: -140, dy: 0 })
    expect(mapKeyAction(key('ArrowDown', { shiftKey: true }), plain)).toEqual({ type: 'pan', dx: 0, dy: 280 })
  })
  it('+ e − dão zoom', () => {
    expect(mapKeyAction(key('+'), plain)).toEqual({ type: 'zoom', delta: 1 })
    expect(mapKeyAction(key('='), plain)).toEqual({ type: 'zoom', delta: 1 })
    expect(mapKeyAction(key('-'), plain)).toEqual({ type: 'zoom', delta: -1 })
  })
  it('Home enquadra a região', () => {
    expect(mapKeyAction(key('Home'), plain)).toEqual({ type: 'fit' })
  })
  it('a tecla é de quem está em foco: campo, menu, painel, modal', () => {
    expect(mapKeyAction(key('ArrowLeft'), inField)).toBeNull()
    expect(mapKeyAction(key('+'), inField)).toBeNull()
  })
  it('ignora atalhos do navegador e teclas já tratadas', () => {
    expect(mapKeyAction(key('+', { ctrlKey: true }), plain)).toBeNull()
    expect(mapKeyAction(key('ArrowUp', { metaKey: true }), plain)).toBeNull()
    expect(mapKeyAction(key('Home', { defaultPrevented: true }), plain)).toBeNull()
  })
  it('outras teclas não são do mapa', () => {
    expect(mapKeyAction(key('a'), plain)).toBeNull()
  })
})

describe('escala', () => {
  it('metros por pixel cai pela metade a cada zoom', () => {
    expect(metersPerPixel(0, 1)).toBeCloseTo(metersPerPixel(0, 0) / 2, 3)
  })
  it('distância redonda: 1, 2 ou 5', () => {
    expect(niceDistance(130)).toBe(100)
    expect(niceDistance(240)).toBe(200)
    expect(niceDistance(730)).toBe(500)
    expect(niceDistance(0)).toBe(0)
  })
  it('rótulo em metros e em quilômetros', () => {
    expect(distanceLabel(200)).toBe('200 m')
    expect(distanceLabel(2000)).toBe('2 km')
    expect(distanceLabel(1500)).toBe('1,5 km')
  })
  it('a barra cabe no máximo e vale o que diz', () => {
    const bar = scaleBar(-21, 12, 96)
    expect(bar.width).toBeLessThanOrEqual(96)
    expect(bar.width).toBeGreaterThan(40)
    expect(bar.label).toMatch(/\d/)
  })
})

import { wheelZoomDelta } from '../helpers/map-feel'

describe('wheelZoomDelta', () => {
  it('rolar para cima aproxima e para baixo afasta', () => {
    expect(wheelZoomDelta({ deltaY: -100, deltaMode: 0, ctrlKey: false })).toBeGreaterThan(0)
    expect(wheelZoomDelta({ deltaY: 100, deltaMode: 0, ctrlKey: false })).toBeLessThan(0)
  })
  it('um giro de roda vale uns 0,28 níveis', () => {
    expect(wheelZoomDelta({ deltaY: -100, deltaMode: 0, ctrlKey: false })).toBeCloseTo(0.28, 2)
  })
  it('a pinça do trackpad pesa mais por pixel que a roda', () => {
    const pinch = Math.abs(wheelZoomDelta({ deltaY: 10, deltaMode: 0, ctrlKey: true }))
    const wheel = Math.abs(wheelZoomDelta({ deltaY: 10, deltaMode: 0, ctrlKey: false }))
    expect(pinch).toBeGreaterThan(wheel)
  })
  it('linhas e páginas viram pixels', () => {
    expect(Math.abs(wheelZoomDelta({ deltaY: 3, deltaMode: 1, ctrlKey: false }))).toBeCloseTo(48 * 0.0028, 4)
  })
  it('uma roda muito rápida não dá um salto enorme', () => {
    expect(Math.abs(wheelZoomDelta({ deltaY: 5000, deltaMode: 0, ctrlKey: false }))).toBeLessThan(1)
  })
})
