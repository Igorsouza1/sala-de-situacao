/** quantos registros houve em um mês ("2025-08") */
export interface MesContagem {
  mes: string
  n: number
}

/** as três séries por mês de uma região (DESIGN.md 13.9); cada uma só tem os meses em que houve algo */
export interface LinhaDoTempo {
  focos: MesContagem[]
  desmatamento: MesContagem[]
  acoes: MesContagem[]
}

export type FonteTempo = keyof LinhaDoTempo
