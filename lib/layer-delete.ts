// Quais camadas se excluem pelo botão direito da lista de Camadas (DESIGN.md 13.1, "Excluir"). A mesma regra vale na tela (o item
// aparece apagado, com o motivo) e no servidor (que recusa). Excluir apaga a camada E tudo o que é dela: por isso ficam de fora as
// camadas que são só uma janela para registros do sistema (apagar "tudo o que é dela" seria apagar as ações, as propriedades, os
// focos) e as que outra tela usa pelo nome (a Situação lê as estações; o Explorar, a bacia; o histórico das ações, o banhado).

/** camadas que outra tela lê pelo slug, e qual tela */
export const PROTECTED_SLUGS: Record<string, string> = {
  'deque-de-pedras': 'A Situação',
  'ponte-do-cure': 'A Situação',
  'bacia-rio-da-prata': 'O Explorar',
  banhado: 'O histórico das ações',
}

export type Deletability = { ok: true } | { ok: false; reason: string }

export interface DeletableLayer {
  slug: string
  scope?: string | null
  /** a organização dona; ausente no mapa (o servidor confere) */
  tenantId?: string | null
  schemaConfig?: unknown
}

export function layerDeletability(layer: DeletableLayer): Deletability {
  const sc = (layer.schemaConfig ?? {}) as { sourceType?: string }
  if (sc.sourceType === 'table') {
    return { ok: false, reason: 'Esta camada mostra registros do sistema e não se exclui por aqui. Para tirá-la da vista, desligue-a.' }
  }
  const user = PROTECTED_SLUGS[layer.slug]
  if (user) return { ok: false, reason: `${user} usa esta camada, por isso ela não se exclui por aqui. Para tirá-la da vista, desligue-a.` }
  if (layer.scope === 'global' || layer.tenantId === null) {
    return { ok: false, reason: 'Esta camada vale para todas as organizações. Só a administração a remove.' }
  }
  return { ok: true }
}
