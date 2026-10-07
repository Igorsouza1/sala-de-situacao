'use client'

import { useRef, useState } from 'react'
import { ImagePlus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { controlItem } from './helpers/control-style'

// O logo da folha: quem gera o mapa envia a imagem (PNG, JPG ou WebP) e ela aparece à esquerda do título. Não é salvo em lugar nenhum:
// vale enquanto a tela está aberta. A imagem vira texto (data URL) para sair igual no arquivo baixado, sem depender de endereço de fora.
const MAX_BYTES = 2 * 1024 * 1024
const TYPES = ['image/png', 'image/jpeg', 'image/webp']

export function LogoPicker({ value, onChange }: { value: string | null; onChange: (url: string | null) => void }) {
  const input = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)

  const pick = (file?: File) => {
    if (!file) return
    if (!TYPES.includes(file.type)) { setError('Use uma imagem PNG, JPG ou WebP.'); return }
    if (file.size > MAX_BYTES) { setError('A imagem passa de 2 MB. Escolha uma menor.'); return }
    const reader = new FileReader()
    reader.onload = () => { setError(null); onChange(String(reader.result)) }
    reader.onerror = () => setError('Não consegui ler esta imagem. Tente outra.')
    reader.readAsDataURL(file)
  }
  const open = () => input.current?.click()

  return (
    <div>
      <input
        ref={input}
        type="file"
        accept={TYPES.join(',')}
        className="hidden"
        aria-label="Imagem do logo"
        // limpar o valor deixa escolher o mesmo arquivo de novo depois de remover
        onChange={(e) => { pick(e.target.files?.[0]); e.target.value = '' }}
      />
      {value ? (
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Logo escolhido" className="h-12 w-16 shrink-0 rounded-sm border border-border bg-muted object-contain p-1" />
          <div className="flex min-w-0 flex-1 items-center justify-end gap-1">
            <button type="button" onClick={open} className={cn('flex h-10 items-center px-3 text-sm font-medium', controlItem())}>Trocar</button>
            <button type="button" onClick={() => { setError(null); onChange(null) }} className={cn('flex h-10 items-center px-3 text-sm font-medium', controlItem())}>Remover</button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={open} className={cn('flex h-12 w-full items-center justify-center gap-2 rounded-md border border-dashed border-border text-sm font-medium', controlItem())}>
          <ImagePlus className="h-4 w-4" aria-hidden />
          Enviar logo
        </button>
      )}
      <p role="status" aria-live="polite" className={cn('text-sm text-crit transition-[opacity,margin] duration-200', error ? 'mt-3 opacity-100' : 'h-0 overflow-clip opacity-0')}>
        {error}
      </p>
    </div>
  )
}
