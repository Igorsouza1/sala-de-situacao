export interface NovidadeFonte {
  /** quantas há de novas (pode passar do que veio em `ids`) */
  count: number
  /** os ids das mais recentes, para o mapa destacá-las (limitado) */
  ids: string[]
}
export interface Novidades {
  /** a hora do banco: vira o ponto de partida da próxima consulta */
  now: string
  /** o maior id de ação da região agora */
  acoesMaxId: number
  focos: NovidadeFonte
  desmatamento: NovidadeFonte
  acoes: NovidadeFonte
}
