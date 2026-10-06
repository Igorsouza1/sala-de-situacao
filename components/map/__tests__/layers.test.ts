import { affectsLine, filterLine, filterNoteFor, initialVisibleSlugs, isLayerOn } from '../helpers/layers'

describe('initialVisibleSlugs', () => {
  const bonito = [
    { slug: 'propriedades' },
    { slug: 'banhado' },
    { slug: 'raw_firms' },
    { slug: 'acoes', groups: [{ id: 'agua' }, { id: 7 }] },
    { slug: 'estradas' },
  ]

  it('abre só com propriedades, focos, desmatamento e ações (e os grupos delas)', () => {
    expect(initialVisibleSlugs(bonito)).toEqual(['propriedades', 'raw_firms', 'acoes__agua', 'acoes__7', 'acoes'])
  })

  it('região sem nenhuma camada-padrão liga todas, em vez de abrir em branco', () => {
    expect(initialVisibleSlugs([{ slug: 'rede-amolar' }, { slug: 'rios' }])).toEqual(['rede-amolar', 'rios'])
  })
})

describe('isLayerOn', () => {
  it('conta a camada ligada se ela ou algum grupo dela está visível', () => {
    expect(isLayerOn('acoes', ['acoes__agua'])).toBe(true)
    expect(isLayerOn('acoes', ['acoes'])).toBe(true)
    expect(isLayerOn('acoes', ['acoes-extra', 'propriedades'])).toBe(false) // prefixo parecido não vale
  })
})

describe('filterNoteFor', () => {
  it('o período vale para 3 camadas e o tamanho para 1; as outras ignoram os dois', () => {
    expect(filterNoteFor('raw_firms', true, true)).toBe('período')
    expect(filterNoteFor('propriedades', true, true)).toBe('tamanho')
    expect(filterNoteFor('estradas', true, true)).toBeNull()
    expect(filterNoteFor('raw_firms', false, true)).toBeNull() // filtro desligado não marca a camada
  })
})

describe('filterLine', () => {
  it('diz quando o filtro deixou zero e quando só filtrou', () => {
    expect(filterLine('período', 0)).toBe('Nenhum resultado para o período escolhido.')
    expect(filterLine('tamanho', 12)).toBe('Filtrada pelo tamanho.')
    expect(filterLine('período', undefined)).toBe('Filtrada pelo período.') // ainda carregando
  })
})

describe('affectsLine', () => {
  it('lista as camadas em português corrente', () => {
    expect(affectsLine(['Focos', 'Desmatamento', 'Ações'], true)).toBe('Vale para: Focos, Desmatamento e Ações.')
    expect(affectsLine(['Propriedades'], true)).toBe('Vale para: Propriedades.')
  })

  it('avisa quando nenhuma está ligada e some quando a região não tem nenhuma', () => {
    expect(affectsLine(['Propriedades'], false)).toBe('Vale para: Propriedades. Nenhuma está ligada: ligue uma em Camadas para ver o efeito.')
    expect(affectsLine([], false)).toBeNull()
  })

  it('não repete o título quando o filtro vale para uma camada de mesmo nome', () => {
    expect(affectsLine(['Propriedades'], true, 'Propriedades')).toBeNull()
    expect(affectsLine(['Propriedades'], false, 'Propriedades')).toBe('Está desligada em Camadas: ligue para ver o efeito.')
    expect(affectsLine(['Focos', 'Ações'], true, 'Período')).toBe('Vale para: Focos e Ações.')
  })
})
