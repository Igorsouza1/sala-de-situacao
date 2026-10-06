// O que deu errado numa busca do mapa, em palavras de quem usa (DESIGN.md 2.1 e 3.2): "sem conexão" e "o servidor falhou" são coisas
// diferentes, com saídas diferentes. A mensagem crua do navegador ("Failed to fetch", "Load failed", "NetworkError…") nunca vai para a tela.

export interface Failure {
  /** o aparelho não falou com o servidor: sem internet, rede caída ou bloqueada */
  offline: boolean
  /** a frase do servidor, quando ele respondeu com uma (nunca a do navegador) */
  message: string | null
}

// o fetch que não chega ao servidor falha com TypeError, e cada navegador escreve a sua frase
const NETWORK_TEXT = /failed to fetch|load failed|networkerror|network request failed|fetch failed|err_internet|err_network/i

export function describeFailure(cause: unknown): Failure {
  const text = cause instanceof Error ? cause.message : ''
  const offline = (typeof navigator !== 'undefined' && navigator.onLine === false) || cause instanceof TypeError || NETWORK_TEXT.test(text)
  return { offline, message: offline || !text ? null : text }
}

/** as frases de reserva dos hooks: quando o servidor não mandou uma própria, a tela não repete uma frase genérica como se fosse apoio */
export const GENERIC_LIST_ERROR = 'Não foi possível carregar os resultados.'
export const GENERIC_OPEN_ERROR = 'Não foi possível abrir o registro.'
