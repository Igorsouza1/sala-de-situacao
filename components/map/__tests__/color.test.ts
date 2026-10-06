import { HUES, TONES, describeColor, hexToHsl, hslToHex, nearestHue, nearestTone, tonesFor } from '../helpers/color'

describe('hslToHex e hexToHsl', () => {
  it('convertem as cores de referência', () => {
    expect(hslToHex(0, 100, 50)).toBe('#ff0000')
    expect(hslToHex(120, 100, 50)).toBe('#00ff00')
    expect(hslToHex(240, 100, 50)).toBe('#0000ff')
    expect(hslToHex(0, 0, 100)).toBe('#ffffff')
    expect(hslToHex(0, 0, 0)).toBe('#000000')
  })

  it('ida e volta mantém a cor (com a folga do arredondamento)', () => {
    for (const hex of ['#c8431a', '#2a7da6', '#32a852', '#808080']) {
      const { h, s, l } = hexToHsl(hex)
      const back = hexToHsl(hslToHex(h, s, l))
      expect(Math.abs(back.l - l)).toBeLessThan(1)
      expect(Math.abs(back.s - s)).toBeLessThan(2)
    }
    expect(hexToHsl('#ff0000')).toEqual({ h: 0, s: 100, l: 50 })
    expect(hexToHsl('#f00').l).toBe(50) // forma curta
  })
})

describe('degraus do seletor', () => {
  it('cada matiz tem 5 tons, do claro ao escuro, todos hex válidos e diferentes entre si', () => {
    for (const { h } of HUES) {
      const tones = tonesFor(h)
      expect(tones).toHaveLength(TONES.length)
      expect(new Set(tones).size).toBe(TONES.length)
      tones.forEach((t) => expect(t).toMatch(/^#[0-9a-f]{6}$/))
      const lightness = tones.map((t) => hexToHsl(t).l)
      expect([...lightness].sort((a, b) => b - a)).toEqual(lightness) // do claro ao escuro
    }
  })

  it('acha a matiz e o tom mais perto de uma cor qualquer', () => {
    expect(nearestHue('#0a0aff')).toBe(240)
    expect(nearestHue('#ff1f00')).toBe(0)
    expect(nearestHue('#c8431a')).toBe(0) // terracota: mais perto do vermelho que do laranja
    expect(nearestHue('#ff0000')).toBe(0)
    // 350° está mais perto do vermelho (10°) que do rosa (20°), passando pela virada do círculo
    expect(nearestHue(hslToHex(350, 80, 50))).toBe(0)
    expect(nearestTone(tonesFor(240)[0])).toBe(0)
    expect(nearestTone(tonesFor(240)[4])).toBe(4)
  })

  it('o tom escolhido volta a ser reconhecido no mesmo degrau', () => {
    for (let i = 0; i < TONES.length; i++) expect(nearestTone(tonesFor(150)[i])).toBe(i)
  })
})

describe('describeColor: a cor em palavras, no lugar do código', () => {
  it('família e tom', () => {
    expect(describeColor('#808080')).toBe('Cinza')
    expect(describeColor('#e5e5e5')).toBe('Cinza claro')
    expect(describeColor('#222222')).toBe('Cinza escuro')
    expect(describeColor(tonesFor(240)[3])).toBe('Azul escuro')
    expect(describeColor(tonesFor(0)[1])).toBe('Vermelho claro')
    expect(describeColor(tonesFor(120)[2])).toBe('Verde')
  })
})
