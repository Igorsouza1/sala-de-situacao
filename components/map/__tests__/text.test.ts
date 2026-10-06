import { tidyText } from '../helpers/text'

describe('tidyText', () => {
  it('põe a primeira letra em maiúscula', () => {
    expect(tidyText('limpeza de aceiro')).toBe('Limpeza de aceiro')
  })
  it('desfaz a caixa-alta de palavras longas e mantém siglas curtas', () => {
    expect(tidyText('Limpeza de ACEIRO em MS')).toBe('Limpeza de aceiro em MS')
    expect(tidyText('RECUPERAÇÃO DE MATA CILIAR')).toBe('Recuperação de mata ciliar')
  })
  it('tira espaços repetidos e das pontas', () => {
    expect(tidyText('  plantio   de   mudas ')).toBe('Plantio de mudas')
  })
  it('lê vazio, nulo e indefinido como vazio', () => {
    expect(tidyText('')).toBe('')
    expect(tidyText(null)).toBe('')
    expect(tidyText(undefined)).toBe('')
  })
  it('não mexe em número nem em palavra com maiúscula só no começo', () => {
    expect(tidyText('Ponto 12 do Rio Prata')).toBe('Ponto 12 do Rio Prata')
  })
})
