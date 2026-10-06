import { cameraFor, modeFromPitch, readSavedMode, saveMode } from '../helpers/view-mode'

const fakeStore = (initial: Record<string, string> = {}) => {
  const data = { ...initial }
  return {
    getItem: (k: string) => data[k] ?? null,
    setItem: (k: string, v: string) => { data[k] = v },
  }
}

describe('modeFromPitch', () => {
  it('trata até ~1° como 2D e acima disso como 3D', () => {
    expect(modeFromPitch(0)).toBe('2d')
    expect(modeFromPitch(1)).toBe('2d')
    expect(modeFromPitch(1.1)).toBe('3d')
    expect(modeFromPitch(50)).toBe('3d')
  })
})

describe('cameraFor', () => {
  it('3D inclina a 50° girado −14°; 2D volta ao norte, de cima', () => {
    expect(cameraFor('3d')).toEqual({ pitch: 50, bearing: -14 })
    expect(cameraFor('2d')).toEqual({ pitch: 0, bearing: 0 })
  })
})

describe('preferência salva', () => {
  it('primeira visita abre em 2D', () => {
    expect(readSavedMode(fakeStore())).toBe('2d')
  })

  it('lembra o último modo escolhido', () => {
    const store = fakeStore()
    saveMode('2d', store)
    expect(readSavedMode(store)).toBe('2d')
    saveMode('3d', store)
    expect(readSavedMode(store)).toBe('3d')
  })

  it('valor estranho ou armazenamento bloqueado cai em 2D, sem quebrar', () => {
    expect(readSavedMode(fakeStore({ 'prisma:mapa:modo': 'xyz' }))).toBe('2d')
    const bloqueado = { getItem: () => { throw new Error('bloqueado') }, setItem: () => { throw new Error('bloqueado') } }
    expect(readSavedMode(bloqueado)).toBe('2d')
    expect(() => saveMode('2d', bloqueado)).not.toThrow()
    expect(readSavedMode(null)).toBe('2d')
  })
})
