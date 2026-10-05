// Modo de visão do mapa (DESIGN.md 13): 3D inclinado ou 2D visto de cima. Salvo no navegador (sem tabela de preferências no banco).
export type ViewMode = '2d' | '3d'

const STORAGE_KEY = 'prisma:mapa:modo'

export const TERRAIN_EXAGGERATION = 1.8
const PITCH_3D = 50
const BEARING_3D = -14
// Até ~1° a câmera ainda está "de cima": o segmento diz 2D, mesmo que a pessoa tenha chegado lá com o mouse ou a bússola.
const FLAT_PITCH = 1

export const modeFromPitch = (pitch: number): ViewMode => (pitch > FLAT_PITCH ? '3d' : '2d')

export const cameraFor = (mode: ViewMode) =>
  mode === '3d' ? { pitch: PITCH_3D, bearing: BEARING_3D } : { pitch: 0, bearing: 0 }

type Store = Pick<Storage, 'getItem' | 'setItem'>

const browserStore = (): Store | null => {
  try {
    return typeof window === 'undefined' ? null : window.localStorage
  } catch {
    return null
  }
}

// Primeira visita (ou armazenamento bloqueado): 2D. O 3D pesa no aparelho, então só abre em 3D quem escolheu.
export function readSavedMode(store: Store | null = browserStore()): ViewMode {
  try {
    return store?.getItem(STORAGE_KEY) === '3d' ? '3d' : '2d'
  } catch {
    return '2d'
  }
}

export function saveMode(mode: ViewMode, store: Store | null = browserStore()): void {
  try {
    store?.setItem(STORAGE_KEY, mode)
  } catch {
    /* sem armazenamento: o mapa funciona igual, só não lembra */
  }
}
