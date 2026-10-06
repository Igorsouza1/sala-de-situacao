// Texto escrito por gente (nomes e tipos de ação) vem com maiúsculas e minúsculas soltas: "limpeza de ACEIRO", "recuperação DE mata".
// A tela mostra arrumado (DESIGN.md 6.2, regra 11); o dado no banco não muda.
//  - palavra em CAIXA-ALTA com 4 letras ou mais vira minúscula, e as de ligação (DE, DA, EM, E…) também;
//    siglas de até 3 letras ficam (MS, CAR, IHP);
//  - a primeira letra do texto fica maiúscula;
//  - espaços repetidos e das pontas saem.
// Sigla longa (IBAMA) perde as maiúsculas: é o custo aceito, porque nomes em caixa-alta digitados por pessoas são bem mais comuns.
const LIGACAO = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'em', 'na', 'no', 'nas', 'nos', 'para', 'por', 'com', 'a', 'o', 'as', 'os', 'ao', 'aos'])

export function tidyText(text: string | null | undefined): string {
  const clean = (text ?? '').replace(/\s+/g, ' ').trim()
  if (!clean) return ''
  const words = clean.split(' ').map((w) => {
    const letters = w.replace(/[^\p{L}]/gu, '')
    const shouting = letters === letters.toUpperCase() && (letters.length >= 4 || LIGACAO.has(letters.toLowerCase()))
    return shouting ? w.toLowerCase() : w
  })
  const joined = words.join(' ')
  return joined.charAt(0).toUpperCase() + joined.slice(1)
}
