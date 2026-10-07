// O que está sob o mouse (ação, área, linha): fica fora do estado do mapa de propósito. Cada movimento do mouse sobre uma feição
// troca este valor; se ele vivesse em useState do MapLibreMap, o mapa inteiro (camadas, fontes, painéis) se refaria a cada
// movimento. Aqui só quem lê (o cartão do hover) se refaz, e o cursor só muda quando passa de "nada" para "algo" (e de volta).

export interface HoverState {
  feature: Record<string, any> | null
  coords: [number, number] | null
}

const NONE: HoverState = { feature: null, coords: null }

export function createHoverStore() {
  let state = NONE
  const listeners = new Set<() => void>()
  return {
    get: () => state,
    set(feature: Record<string, any> | null, coords: [number, number] | null) {
      // nada sob o mouse de novo: nada a avisar
      if (!feature && !state.feature) return
      state = feature ? { feature, coords } : NONE
      listeners.forEach((l) => l())
    },
    subscribe(listener: () => void) {
      listeners.add(listener)
      return () => { listeners.delete(listener) }
    },
  }
}

export type HoverStore = ReturnType<typeof createHoverStore>
