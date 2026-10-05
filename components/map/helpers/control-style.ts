import { cn } from '@/lib/utils'

// Estilo único dos controles sobre o mapa (DESIGN.md 13): o mesmo raio, borda e sombra no dock, nos painéis e na câmera.
export const controlSurface = 'border border-border bg-card shadow-control'

// Item dentro de um controle (botão do dock, da câmera): ativo em verde claro, como as abas e o segmento 2D|3D.
export const controlItem = (active = false) =>
  cn(
    'rounded-sm transition-[background-color,color,transform] duration-180 ease-out active:scale-[0.96] focus-visible:outline-hidden focus-visible:ring-[3px] focus-visible:ring-ring/30',
    active ? 'bg-secondary text-secondary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
  )
