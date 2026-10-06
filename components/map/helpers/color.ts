// Cor em palavras e em degraus (DESIGN.md 13.3): o seletor de "Outra cor" não pede para arrastar um ponto num quadrado nem para digitar
// um código. A pessoa escolhe a MATIZ (12 famílias) e o TOM (5 degraus, do claro ao escuro); a tela cuida do resto.

export const HUES = [
  { h: 0, name: 'Vermelho' },
  { h: 30, name: 'Laranja' },
  { h: 60, name: 'Amarelo' },
  { h: 90, name: 'Verde-limão' },
  { h: 120, name: 'Verde' },
  { h: 150, name: 'Verde-água' },
  { h: 180, name: 'Ciano' },
  { h: 210, name: 'Azul-céu' },
  { h: 240, name: 'Azul' },
  { h: 270, name: 'Violeta' },
  { h: 300, name: 'Magenta' },
  { h: 330, name: 'Rosa' },
] as const

// Saturação fixa e um pouco contida: os tons ficam ao lado da paleta da marca (verdes minerais, terracota), não de um arco-íris de tela
const SATURATION = 55
export const TONES = [
  { l: 82, name: 'muito claro' },
  { l: 68, name: 'claro' },
  { l: 52, name: 'médio' },
  { l: 40, name: 'escuro' },
  { l: 28, name: 'muito escuro' },
] as const

export function hslToHex(h: number, s: number, l: number): string {
  const sat = s / 100
  const light = l / 100
  const k = (n: number) => (n + h / 30) % 12
  const a = sat * Math.min(light, 1 - light)
  const f = (n: number) => light - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  const hex = (v: number) => Math.round(v * 255).toString(16).padStart(2, '0')
  return `#${hex(f(0))}${hex(f(8))}${hex(f(4))}`
}

export function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const h6 = hex.length === 4 ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}` : hex
  const r = parseInt(h6.slice(1, 3), 16) / 255
  const g = parseInt(h6.slice(3, 5), 16) / 255
  const b = parseInt(h6.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  const d = max - min
  if (d === 0) return { h: 0, s: 0, l: l * 100 }
  const s = d / (1 - Math.abs(2 * l - 1))
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4
  return { h: (h * 60 + 360) % 360, s: s * 100, l: l * 100 }
}

export const tonesFor = (hue: number) => TONES.map((t) => hslToHex(hue, SATURATION, t.l))
export const hueSwatch = (hue: number) => hslToHex(hue, SATURATION, 52)

const circular = (a: number, b: number) => Math.min(Math.abs(a - b), 360 - Math.abs(a - b))

/** A matiz da lista mais perto da cor (para o seletor abrir já no lugar certo). */
export function nearestHue(hex: string): number {
  const { h } = hexToHsl(hex)
  return HUES.reduce((best, x) => (circular(x.h, h) < circular(best.h, h) ? x : best), HUES[0]).h
}

/** O degrau de tom mais perto da cor. */
export function nearestTone(hex: string): number {
  const { l } = hexToHsl(hex)
  return TONES.reduce((best, t, i) => (Math.abs(t.l - l) < Math.abs(TONES[best].l - l) ? i : best), 0)
}

/** A cor em palavras ("Azul escuro", "Cinza claro"): é o que se mostra no lugar do código. */
export function describeColor(hex: string): string {
  const { s } = hexToHsl(hex)
  const base = s < 12 ? 'Cinza' : (HUES.find((x) => x.h === nearestHue(hex))?.name ?? 'Cor')
  // os mesmos degraus do seletor: 0 e 1 são claros, 2 é o meio, 3 e 4 são escuros
  const tone = nearestTone(hex)
  return `${base} ${tone <= 1 ? 'claro' : tone >= 3 ? 'escuro' : ''}`.trim()
}
