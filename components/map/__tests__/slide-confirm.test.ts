import { SLIDE_DONE, slideDone, slideKey, slideProgress } from '../helpers/slide-confirm'

describe('arrastar para concluir', () => {
  it('mede o quanto andou, sem passar das pontas', () => {
    expect(slideProgress(0, 200)).toBe(0)
    expect(slideProgress(100, 200)).toBe(0.5)
    expect(slideProgress(-30, 200)).toBe(0)
    expect(slideProgress(260, 200)).toBe(1)
    expect(slideProgress(50, 0)).toBe(0)
  })

  it('só conclui perto do fim', () => {
    expect(slideDone(0.5)).toBe(false)
    expect(slideDone(SLIDE_DONE - 0.01)).toBe(false)
    expect(slideDone(SLIDE_DONE)).toBe(true)
    expect(slideDone(1)).toBe(true)
  })

  it('as setas andam um décimo; Home volta; End não conclui de uma vez', () => {
    expect(slideKey(0, 'ArrowRight')).toBe(0.1)
    expect(slideKey(0.9, 'ArrowRight')).toBe(1)
    expect(slideKey(1, 'ArrowRight')).toBe(1)
    expect(slideKey(0.3, 'ArrowLeft')).toBe(0.2)
    expect(slideKey(0, 'ArrowLeft')).toBe(0)
    expect(slideKey(0.7, 'Home')).toBe(0)
    expect(slideKey(0.2, 'End')).toBeNull()
    expect(slideKey(0.2, 'Enter')).toBeNull()
  })

  it('dez setas chegam ao fim, sem erro de arredondamento', () => {
    let p = 0
    for (let i = 0; i < 10; i++) p = slideKey(p, 'ArrowRight')!
    expect(p).toBe(1)
    expect(slideDone(p)).toBe(true)
  })
})
