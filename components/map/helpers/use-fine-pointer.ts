import { useSyncExternalStore } from 'react'

// Mouse (ponteiro preciso) ou toque. Criar, renomear e apagar pasta é coisa de computador (DESIGN.md 13.1): no toque não há botão
// direito e o segurar já é o gesto de arrastar. No servidor vale "mouse", e o navegador corrige na hidratação.
const QUERY = '(pointer: fine)'

function subscribe(onChange: () => void) {
  const media = window.matchMedia(QUERY)
  media.addEventListener('change', onChange)
  return () => media.removeEventListener('change', onChange)
}

export const useFinePointer = (): boolean =>
  useSyncExternalStore(subscribe, () => window.matchMedia(QUERY).matches, () => true)
