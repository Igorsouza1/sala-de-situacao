import { isHexColor } from '@/lib/layer-style'
import { describeColor } from './color'

// Paleta do editor de camadas (DESIGN.md 13.3): as cores de dados e de marca do projeto, lidas dos tokens (sem hex no código).
// Os nomes dizem a cor, não o significado: "Crítico" numa camada de estradas diria ao usuário que há algo crítico (4: cor quente é só para o crítico).
// mais "Outra cor…" para o caso raro. O catálogo guarda hex (o MapLibre não lê var()), então os tokens são lidos já resolvidos.
// Cores livres foram o que deixou o mapa com tons fora da paleta; a paleta guia sem trancar.
const TOKENS: { name: string; token: string }[] = [
  { name: 'Terracota', token: '--color-crit' },
  { name: 'Âmbar', token: '--color-warn' },
  { name: 'Verde', token: '--color-ok' },
  { name: 'Azul', token: '--color-water' },
  { name: 'Verde mineral', token: '--color-mineral' },
  { name: 'Verde floresta', token: '--color-primary' },
  { name: 'Grafite', token: '--color-foreground' },
  { name: 'Cinza', token: '--color-stone' },
  { name: 'Branco', token: '--color-background' },
]

export interface PaletteColor {
  name: string
  hex: string
}

export function readPalette(): PaletteColor[] {
  if (typeof document === 'undefined') return []
  const style = getComputedStyle(document.documentElement)
  return TOKENS.flatMap(({ name, token }) => {
    const hex = style.getPropertyValue(token).trim().toLowerCase()
    return isHexColor(hex) ? [{ name, hex }] : []
  })
}

// O nome da cor, para mostrar no lugar do código; fora da paleta, a família e o tom ("Azul escuro")
export function colorName(hex: string): string {
  return readPalette().find((p) => p.hex === hex.toLowerCase())?.name ?? describeColor(hex)
}

// <input type="color"> só aceita #rrggbb
export const toSixDigits = (hex: string) =>
  /^#[0-9a-f]{3}$/i.test(hex) ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}` : hex.toLowerCase()

// Ícones para camadas de ponto: poucos, de significado claro (DESIGN.md 11: ícone com rótulo quando não for óbvio)
export const LAYER_ICONS: { name: string; label: string }[] = [
  { name: 'map-pin', label: 'Local' },
  { name: 'waves', label: 'Água' },
  { name: 'droplets', label: 'Nascente' },
  { name: 'flame', label: 'Fogo' },
  { name: 'sprout', label: 'Vegetação' },
  { name: 'trees', label: 'Mata' },
  { name: 'mountain', label: 'Relevo' },
  { name: 'paw-print', label: 'Fauna' },
  { name: 'activity', label: 'Monitoramento' },
  { name: 'eye', label: 'Observação' },
  { name: 'shield', label: 'Fiscalização' },
  { name: 'hammer', label: 'Obra' },
  { name: 'house', label: 'Sede' },
  { name: 'flag', label: 'Marco' },
  { name: 'camera', label: 'Foto' },
  { name: 'fish', label: 'Peixe' },
  { name: 'bird', label: 'Ave' },
  { name: 'tent', label: 'Acampamento' },
]
