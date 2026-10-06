import { describeFailure } from '../helpers/network'

describe('describeFailure', () => {
  it('"Failed to fetch" (Chrome) é falta de conexão, e a frase do navegador não vai para a tela', () => {
    expect(describeFailure(new TypeError('Failed to fetch'))).toEqual({ offline: true, message: null })
  })
  it('cada navegador escreve a sua frase', () => {
    expect(describeFailure(new Error('Load failed')).offline).toBe(true) // Safari
    expect(describeFailure(new Error('NetworkError when attempting to fetch resource.')).offline).toBe(true) // Firefox
  })
  it('um TypeError do fetch é rede, qualquer que seja o texto', () => {
    expect(describeFailure(new TypeError('qualquer coisa')).offline).toBe(true)
  })
  it('a frase que o servidor mandou é mantida', () => {
    expect(describeFailure(new Error('Registro não encontrado nesta Região.'))).toEqual({ offline: false, message: 'Registro não encontrado nesta Região.' })
  })
  it('sem texto nenhum, não há mensagem a mostrar', () => {
    expect(describeFailure('estranho')).toEqual({ offline: false, message: null })
  })
  it('aparelho sem rede (navigator.onLine falso) conta como sem conexão', () => {
    const original = Object.getOwnPropertyDescriptor(globalThis, 'navigator')
    Object.defineProperty(globalThis, 'navigator', { value: { onLine: false }, configurable: true })
    try {
      expect(describeFailure(new Error('o que for')).offline).toBe(true)
    } finally {
      if (original) Object.defineProperty(globalThis, 'navigator', original)
      else delete (globalThis as { navigator?: unknown }).navigator
    }
  })
})
