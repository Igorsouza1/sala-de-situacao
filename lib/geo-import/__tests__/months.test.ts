import { compareSummary, looksLikeMonths, parseMonthlySummary } from '../months'

// o resumo que veio junto do raster de fogo mensal da Rede Amolar (trecho)
const CSV = '\uFEFFano;jan;fev;mar;abr;mai;jun;jul;ago;set;out;nov;dez;total_ha\n2018;0.3;12.4;0.3;0;0.1;0;4.3;0;618.6;1531.4;7.1;18.4;2192.9\n2022;0;107.1;0;28.0;6.0;2.2;1.4;46.5;118.1;5.1;40.4;81.8;436.6\n'

test('reconhece o raster de mês do fogo pelos valores', () => {
  expect(looksLikeMonths([1, 2, 9, 10, 12])).toBe(true)
  expect(looksLikeMonths([1, 13])).toBe(false)
  expect(looksLikeMonths([])).toBe(false)
  // só o 1 é o raster de fogo de antes (0/1 por ano), não mês
  expect(looksLikeMonths([1])).toBe(false)
})

test('lê o resumo por ano somando os meses', () => {
  const s = parseMonthlySummary(CSV)!
  expect(s.get(2018)).toBeCloseTo(2192.9, 1)
  expect(s.get(2022)).toBeCloseTo(436.6, 1)
})

test('aceita vírgula como separador e decimal com vírgula quando o separador é ;', () => {
  const head = 'ano,jan,fev,mar,abr,mai,jun,jul,ago,set,out,nov,dez\n'
  expect(parseMonthlySummary(head + '2020,1.5,0,0,0,0,0,0,0,0,0,0,0.5')!.get(2020)).toBeCloseTo(2)
  const semi = 'ano;jan;fev;mar;abr;mai;jun;jul;ago;set;out;nov;dez\n2020;1,5;0;0;0;0;0;0;0;0;0;0;0,5'
  expect(parseMonthlySummary(semi)!.get(2020)).toBeCloseTo(2)
})

test('o que não é um resumo mensal devolve null', () => {
  expect(parseMonthlySummary('nome;valor\na;1')).toBeNull()
  expect(parseMonthlySummary('')).toBeNull()
})

test('diz os anos que não batem, com folga para o arredondamento', () => {
  const summary = new Map([[2018, 2192.9], [2022, 436.6], [2030, 1]])
  expect(compareSummary(new Map([[2018, 2200], [2022, 436]]), summary)).toEqual({ differ: [], compared: 2 })
  expect(compareSummary(new Map([[2018, 3000], [2022, 436]]), summary)).toEqual({ differ: [2018], compared: 2 })
})

test('o nome da série de um arquivo só sai do nome do arquivo, com o período em palavras', () => {
  const { bandSeriesName } = require('../class-series-read') as typeof import('../class-series-read')
  expect(bandSeriesName('fogo_mensal_raster_2018_2023.tif', 2018, 2023)).toBe('Fogo mensal 2018 a 2023')
})

test('a cor do fogo: todos os meses, ou só o escolhido', () => {
  const { monthLut } = require('../months') as typeof import('../months')
  const all = monthLut(null)
  expect(all[0]).toBe(0)
  expect(all[10] & 255).toBe(0xc8)
  expect(all[13]).toBe(0)
  const oct = monthLut(10)
  expect(oct[10]).toBe(all[10])
  expect(oct[9]).toBe(0)
})
