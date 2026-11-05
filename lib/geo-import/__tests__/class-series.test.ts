import {
  OTHERS,
  SeriesDecoder,
  UNCHANGED,
  buildStats,
  chartClasses,
  classAreas,
  deltaFrame,
  groupSeries,
  missingYears,
  normalizeClasses,
  referenceGrid,
  repeatedYears,
  resampleNearest,
  rowAreasHa,
  sameGrid,
  seriesName,
  yearFromName,
  yearRow,
  type Grid,
} from '../class-series'
import { classInfo, isMapBiomasLegend, sortClasses } from '../mapbiomas'

const f = (name: string) => ({ name })

describe('arquivos da série', () => {
  it('acha o ano no nome, e só quando é um ano só', () => {
    expect(yearFromName('CN_MapBiomas_UsoSolo_BAP_1985.tif')).toBe(1985)
    expect(yearFromName('uso_2024_v2.tif')).toBe(2024)
    expect(yearFromName('fogo_2004_2025.tif')).toBeNull() // período: é o raster de bandas, não um ano
    expect(yearFromName('area_12345.tif')).toBeNull()
    expect(yearFromName('sem_ano.tif')).toBeNull()
  })

  it('junta os anos do mesmo tronco numa série, em ordem, e deixa o resto um a um', () => {
    const { series, singles } = groupSeries([
      f('uso_1987.tif'), f('uso_1985.tif'), f('uso_1986.tif'),
      f('fogo_2004_2025.tif'), f('limite.geojson'), f('outro_2010.tif'),
    ])
    expect(series).toHaveLength(1)
    expect(series[0].map((x) => x.name)).toEqual(['uso_1985.tif', 'uso_1986.tif', 'uso_1987.tif'])
    expect(singles.map((x) => x.name).sort()).toEqual(['fogo_2004_2025.tif', 'limite.geojson', 'outro_2010.tif'])
  })

  it('sugere um nome que a pessoa só confirma', () => {
    expect(seriesName('CN_MapBiomas_UsoSolo_BAP_1985.tif')).toBe('Uso do solo MapBiomas (BAP)')
    expect(seriesName('mapbiomas_cobertura_2000.tif')).toBe('Uso do solo MapBiomas')
    expect(seriesName('ndvi_bonito_2001.tif')).toBe('Ndvi bonito')
  })

  it('diz os anos que faltam e os repetidos', () => {
    expect(missingYears([1985, 1986, 1989])).toEqual([1987, 1988])
    expect(missingYears([2000, 2001])).toEqual([])
    expect(repeatedYears([2000, 2001, 2001, 2002, 2000])).toEqual([2000, 2001])
  })
})

// a grade dos rasters de Bonito: 1985 a 2023 em ~100 m, 2024 em ~30 m e com os cantos um pouco deslocados
const g100: Grid = { width: 627, height: 431, bounds: [-56.78286843530861, -21.66224425584338, -56.219624752165664, -21.275070368387865] }
const g30: Grid = { width: 2089, height: 1433, bounds: [-56.7827786037802, -21.6617052666729, -56.2198044152225, -21.275519526029917] }

describe('grade', () => {
  it('reconhece a mesma grade e separa a de outra resolução', () => {
    expect(sameGrid(g100, { ...g100, bounds: [...g100.bounds] })).toBe(true)
    expect(sameGrid(g100, g30)).toBe(false)
  })

  it('a série fica na grade da maioria', () => {
    expect(referenceGrid([g100, g100, g30, g100])).toBe(g100)
  })

  it('ajusta um ano a outra grade pelo vizinho mais próximo', () => {
    // 4 × 2 → 2 × 1, mesmos cantos: cada pixel novo pega a classe do centro
    const from: Grid = { width: 4, height: 2, bounds: [0, 0, 4, 2] }
    const to: Grid = { width: 2, height: 1, bounds: [0, 0, 4, 2] }
    const src = Uint8Array.from([3, 3, 15, 15, 3, 9, 15, 21])
    // centro do pixel novo 0 = (1, 1): coluna 1, linha 1 → 9; pixel 1 = (3, 1): coluna 3, linha 1 → 21
    expect(Array.from(resampleNearest(src, from, to))).toEqual([9, 21])
  })

  it('o que cai fora do ano de origem fica "fora da área"', () => {
    const from: Grid = { width: 1, height: 1, bounds: [0, 0, 1, 1] }
    const to: Grid = { width: 2, height: 1, bounds: [0, 0, 2, 1] }
    expect(Array.from(resampleNearest(Uint8Array.from([5]), from, to))).toEqual([5, 0])
  })
})

describe('codificar e decodificar', () => {
  it('normaliza: "sem dado" e valores fora de 1 a 254 viram 0', () => {
    expect(Array.from(normalizeClasses([0, 3, 255, -1, 15, 99], 99))).toEqual([0, 3, 0, 0, 15, 0])
  })

  it('cada ano depois do primeiro só guarda o que mudou', () => {
    expect(Array.from(deltaFrame(Uint8Array.from([3, 3, 15]), Uint8Array.from([3, 15, 15])))).toEqual([UNCHANGED, 15, UNCHANGED])
  })

  it('remonta qualquer ano, para a frente e para trás, mesmo chegando aos pedaços', () => {
    const years = [
      Uint8Array.from([3, 3, 15, 0]),
      Uint8Array.from([3, 15, 15, 0]),
      Uint8Array.from([21, 15, 15, 0]),
      Uint8Array.from([21, 15, 3, 0]),
    ]
    const bytes = new Uint8Array(16)
    years.forEach((y, k) => bytes.set(k === 0 ? y : deltaFrame(years[k - 1], y), k * 4))
    const dec = new SeriesDecoder(4, 4)
    dec.push(bytes.subarray(0, 5))
    dec.push(bytes.subarray(5, 11))
    dec.push(bytes.subarray(11))
    const frames = dec.finish()
    expect(frames.count).toBe(4)
    expect(Array.from(frames.frame(3))).toEqual([21, 15, 3, 0])
    expect(Array.from(frames.frame(1))).toEqual([3, 15, 15, 0])
    expect(Array.from(frames.frame(2))).toEqual([21, 15, 15, 0])
    expect(Array.from(frames.frame(0))).toEqual([3, 3, 15, 0])
  })

  it('recusa bytes a mais ou a menos que o informado', () => {
    const dec = new SeriesDecoder(2, 2)
    dec.push(Uint8Array.from([1, 2, 3]))
    expect(() => dec.finish()).toThrow()
    expect(() => new SeriesDecoder(1, 1).push(Uint8Array.from([1, 2]))).toThrow()
  })
})

describe('áreas', () => {
  it('um pixel de 1° no equador tem uns 1,236 milhão de hectares', () => {
    const rows = rowAreasHa({ width: 1, height: 1, bounds: [0, 0, 1, 1] })
    expect(rows[0] / 1e6).toBeCloseTo(1.2364, 3)
  })

  it('o pixel encolhe longe do equador', () => {
    const rows = rowAreasHa({ width: 1, height: 2, bounds: [0, 0, 1, 60] })
    expect(rows[0]).toBeLessThan(rows[1])
  })

  it('a área de Bonito a ~100 m bate com o tamanho do pixel (~0,87 ha por pixel)', () => {
    const rows = rowAreasHa(g100)
    expect(rows[200]).toBeGreaterThan(0.8)
    expect(rows[200]).toBeLessThan(0.95)
  })

  it('soma os hectares por classe e ignora o "fora da área"', () => {
    const g: Grid = { width: 2, height: 1, bounds: [0, 0, 2, 1] }
    const areas = classAreas(Uint8Array.from([0, 3]), g)
    expect([...areas.keys()]).toEqual([3])
  })

  it('monta a tabela do gráfico na ordem da legenda', () => {
    const stats = buildStats([new Map([[15, 10.04], [3, 5]]), new Map([[15, 12]])], sortClasses)
    expect(stats.classes).toEqual([3, 15])
    expect(stats.ha).toEqual([[5, 10], [0, 12]])
  })

  it('mostra no máximo 8 classes; as menores somam em "Outras"', () => {
    const classes = [3, 4, 9, 11, 12, 15, 20, 21, 25, 33, 39, 41]
    const stats = { classes, ha: [classes.map((c, k) => 100 - k)] }
    const shown = chartClasses(stats)
    expect(shown).toHaveLength(8)
    expect(shown[shown.length - 1]).toBe(OTHERS)
    const row = yearRow(stats, 0, shown)
    const total = [...row.values()].reduce((a, b) => a + b, 0)
    expect(total).toBe(classes.reduce((s, _, k) => s + 100 - k, 0))
  })
})

describe('legenda do MapBiomas', () => {
  it('dá nome e cor oficiais, e reconhece a legenda', () => {
    expect(classInfo(15).name).toBe('Pastagem')
    expect(classInfo(3).color).toBe('#1f8d49')
    expect(classInfo(200).name).toBe('Classe 200')
    expect(isMapBiomasLegend([3, 4, 11, 12, 15, 21, 25, 33, 39, 41, 9, 20])).toBe(true)
    expect(isMapBiomasLegend([3, 200])).toBe(false)
  })
})

describe('pintar uma série de classes', () => {
  // import tardio para não misturar com os testes acima
  const { classLut, paintClasses } = require('../raster-paint') as typeof import('../raster-paint')
  it('cada classe ganha a cor da legenda e o "fora da área" fica transparente', () => {
    const lut = classLut((c) => classInfo(c).color)
    expect(lut[0]).toBe(0)
    expect(lut[3] & 255).toBe(0x1f) // vermelho de #1f8d49
    expect(lut[3] >>> 24).toBe(255)
    const dest = new Uint32Array(2)
    paintClasses(Uint8Array.from([0, 3]), dest, 2, 1, [0, 0, 2, 1], lut)
    expect(dest[0]).toBe(0)
    expect(dest[1]).toBe(lut[3])
  })
})

describe('região', () => {
  const { shareInside } = require('../class-series') as typeof import('../class-series')
  it('diz quanto do raster cai na região aberta', () => {
    expect(shareInside([0, 0, 2, 2], [-1, -1, 3, 3])).toBe(1)
    expect(shareInside([0, 0, 2, 2], [1, 0, 3, 2])).toBe(0.5)
    expect(shareInside([0, 0, 2, 2], [5, 5, 6, 6])).toBe(0)
  })
})

describe('reconhecer um raster de classes pelos valores', () => {
  const { looksLikeClasses } = require('../mapbiomas') as typeof import('../mapbiomas')
  it('uso do solo do MapBiomas, mesmo com um arquivo só', () => {
    expect(looksLikeClasses([3, 4, 11, 12, 15, 21, 39], 'CN_MapBiomas_UsoSolo_BAP_2024.tif')).toBe(true)
    expect(looksLikeClasses([3, 15, 33], 'recorte.tif')).toBe(true)
    expect(looksLikeClasses([15], 'uso_2010.tif')).toBe(true)
  })
  it('valores comuns não passam (o 2 não é código da legenda; poucos valores sem nome do assunto)', () => {
    expect(looksLikeClasses([1, 2, 3, 4, 5], 'fogo_frequencia.tif')).toBe(false)
    expect(looksLikeClasses([1, 3], 'ndvi.tif')).toBe(false)
    expect(looksLikeClasses([], 'uso.tif')).toBe(false)
  })
})
