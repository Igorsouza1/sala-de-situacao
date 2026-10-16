import { matchLayers, searchTerms } from '../helpers/layer-search'

const options = [
  { slug: 'prop', label: 'Propriedades rurais' },
  { slug: 'acoes', label: 'Ações', subOptions: [{ label: 'Fiscalização' }, { label: 'Recuperação' }] },
  { slug: 'agua', label: 'Nascentes de água' },
]

describe('matchLayers', () => {
  it('sem nada digitado não há busca', () => {
    expect(matchLayers(options, '')).toBeNull()
    expect(matchLayers(options, '   ')).toBeNull()
  })

  it('ignora acento e maiúscula', () => {
    expect([...matchLayers(options, 'acoes')!]).toEqual(['acoes'])
    expect([...matchLayers(options, 'ÁGUA')!]).toEqual(['agua'])
  })

  it('todas as palavras precisam aparecer, em qualquer ordem', () => {
    expect([...matchLayers(options, 'rurais propriedades')!]).toEqual(['prop'])
    expect([...matchLayers(options, 'agua propriedades')!]).toEqual([])
  })

  it('acha a camada com grupos pelo nome de um grupo', () => {
    expect([...matchLayers(options, 'fiscalizacao')!]).toEqual(['acoes'])
  })

  it('nenhum resultado é um conjunto vazio, não nulo', () => {
    expect(matchLayers(options, 'xyz')!.size).toBe(0)
  })
})

describe('searchTerms', () => {
  it('separa as palavras e tira o acento', () => {
    expect(searchTerms('  Recuperação  Áreas ')).toEqual(['recuperacao', 'areas'])
  })
})
