"use client"

import { Check, Info, OctagonAlert } from "lucide-react"

import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

// ícone em círculo tingido, na cor do alerta (DESIGN.md 12). Ícones em lucide por enquanto; o padrão do DESIGN.md é Tabler (pendência).
const KIND = {
  default: { Icon: Info, color: "text-muted-foreground", tint: "bg-stone/15" },
  destructive: { Icon: OctagonAlert, color: "text-crit", tint: "bg-crit/10" },
  success: { Icon: Check, color: "text-ok", tint: "bg-ok/10" },
} as const

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        const { Icon, color, tint } = KIND[(props.variant ?? "default") as keyof typeof KIND]
        return (
          <Toast key={id} {...props}>
            <span className={`grid size-7 shrink-0 place-items-center rounded-full ${tint}`} aria-hidden>
              <Icon className={`size-4 ${color}`} />
            </span>
            <div className="grid flex-1 gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
