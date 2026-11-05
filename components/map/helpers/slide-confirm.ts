// A conta do "arrastar para concluir" (DESIGN.md 13.1, Excluir camada): quanto o botão andou, se já chegou ao fim e o que cada tecla faz.
// Pura, para o teste: o componente só mede a faixa e desenha.

/** a partir daqui, soltar conclui (o dedo raramente para exatamente no último pixel) */
export const SLIDE_DONE = 0.92
/** cada seta anda um décimo */
export const SLIDE_KEY_STEP = 0.1

/** o quanto andou (0 a 1), pelo deslocamento do ponteiro e o caminho que o botão tem para andar */
export function slideProgress(dx: number, travel: number): number {
  if (!(travel > 0)) return 0
  return Math.min(1, Math.max(0, dx / travel))
}

export function slideDone(progress: number): boolean {
  return progress >= SLIDE_DONE
}

/** a tecla move o botão (setas, Home); outra tecla não mexe (null). O fim só se alcança passo a passo: nada de "End" conclui de uma vez. */
export function slideKey(progress: number, key: string): number | null {
  if (key === 'ArrowRight' || key === 'ArrowUp') return Math.min(1, Math.round((progress + SLIDE_KEY_STEP) * 10) / 10)
  if (key === 'ArrowLeft' || key === 'ArrowDown') return Math.max(0, Math.round((progress - SLIDE_KEY_STEP) * 10) / 10)
  if (key === 'Home') return 0
  return null
}
