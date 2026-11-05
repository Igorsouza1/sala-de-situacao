// Legenda do MapBiomas (coleções 9 e 10, uso e cobertura da terra): o nome e a cor oficial de cada código.
// As cores são as do próprio MapBiomas, para o mapa e o gráfico baterem com o que a pessoa vê no site e nos relatórios dele
// (DESIGN.md 13, "Série de anos": a amostra é o que o mapa desenha). Ficam aqui, fora das telas, por serem dado e não moldura.
// Um código que não está na legenda vira "Classe N" com uma cor neutra: o raster ainda entra, só sem nome.

export interface ClassInfo {
  name: string
  color: string
  /** ordem de leitura da legenda do MapBiomas: floresta, outras naturais, agropecuária, sem vegetação, água */
  order: number
}

const LEGEND: Record<number, [string, string]> = {
  1: ['Floresta', '#32a65e'],
  3: ['Formação florestal', '#1f8d49'],
  4: ['Formação savânica', '#7dc975'],
  5: ['Mangue', '#04381d'],
  6: ['Floresta alagável', '#026975'],
  49: ['Restinga arbórea', '#02d659'],
  10: ['Vegetação herbácea e arbustiva', '#ad975a'],
  11: ['Campo alagado e área pantanosa', '#519799'],
  12: ['Formação campestre', '#d6bc74'],
  32: ['Apicum', '#fc8114'],
  29: ['Afloramento rochoso', '#ffaa5f'],
  50: ['Restinga herbácea', '#ad5100'],
  13: ['Outras formações não florestais', '#d89f5c'],
  14: ['Agropecuária', '#ffffb2'],
  15: ['Pastagem', '#edde8e'],
  18: ['Agricultura', '#e974ed'],
  19: ['Lavoura temporária', '#c27ba0'],
  39: ['Soja', '#f5b3c8'],
  20: ['Cana', '#db7093'],
  40: ['Arroz', '#c71585'],
  62: ['Algodão', '#ff69b4'],
  41: ['Outras lavouras temporárias', '#f54ca9'],
  36: ['Lavoura perene', '#d082de'],
  46: ['Café', '#d68fe2'],
  47: ['Citrus', '#9932cc'],
  35: ['Dendê', '#9065d0'],
  48: ['Outras lavouras perenes', '#e6ccff'],
  9: ['Silvicultura', '#7a5900'],
  21: ['Mosaico de usos', '#ffefc3'],
  22: ['Área não vegetada', '#d4271e'],
  23: ['Praia, duna e areal', '#ffa07a'],
  24: ['Área urbanizada', '#d4271e'],
  30: ['Mineração', '#9c0027'],
  75: ['Usina fotovoltaica', '#c12100'],
  25: ['Outras áreas não vegetadas', '#db4d4f'],
  26: ["Corpo d'água", '#2532e4'],
  33: ['Rio, lago e oceano', '#2532e4'],
  31: ['Aquicultura', '#091077'],
  27: ['Não observado', '#ffffff'],
}

const ORDER = Object.keys(LEGEND).map(Number)

/** cor de uma classe fora da legenda: cinza neutro (não compete com as cores do MapBiomas) */
const UNKNOWN_COLOR = '#9ca3a0'

export function classInfo(code: number): ClassInfo {
  const known = LEGEND[code]
  if (known) return { name: known[0], color: known[1], order: ORDER.indexOf(code) }
  return { name: `Classe ${code}`, color: UNKNOWN_COLOR, order: ORDER.length + code }
}

/** Todos os códigos (menos o 0, "fora da área") são do MapBiomas? Então a camada leva os nomes e as cores dele. */
export function isMapBiomasLegend(codes: number[]): boolean {
  return codes.length > 0 && codes.every((c) => c in LEGEND)
}

/** Os códigos na ordem da legenda do MapBiomas (os desconhecidos no fim, pelo número). */
export function sortClasses(codes: number[]): number[] {
  return [...codes].sort((a, b) => classInfo(a).order - classInfo(b).order)
}

const NAME_HINT = /mapbiomas|uso|cobertura|lulc|land.?cover|land.?use/i

/**
 * Um raster de uma banda é de CLASSES (uso do solo), e não de valores, quando todos os seus valores (menos o 0) são códigos da
 * legenda do MapBiomas e o nome diz o assunto, ou há pelo menos 3 classes. Assim um arquivo de uso do solo nunca pede cor:
 * cada classe já tem a sua. Um raster de "quantas vezes queimou" (1, 2, 3…) não passa: o 2 não é código da legenda.
 */
export function looksLikeClasses(codes: number[], fileName: string): boolean {
  return isMapBiomasLegend(codes) && (NAME_HINT.test(fileName) || codes.length >= 3)
}
