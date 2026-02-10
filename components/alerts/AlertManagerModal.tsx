"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trash2, Flame, Axe, CloudRain, Waves } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Label } from "@/components/ui/label"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface Preferences {
  fogo: boolean;
  desmatamento: boolean;
  chuva: boolean;
  nivel_rio: boolean;
}

interface Recipient {
  id: number;
  email: string;
  regiaoId: number;
  preferencias: Preferences;
  ativo: boolean;
}

interface AlertManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AlertManagerModal({ isOpen, onClose }: AlertManagerModalProps) {
  const [recipients, setRecipients] = useState<Recipient[]>([])
  const [loading, setLoading] = useState(false)
  const [newEmail, setNewEmail] = useState("")
  const { toast } = useToast()

  const fetchRecipients = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/alerts/recipients")
      if (response.ok) {
        const data = await response.json()
        setRecipients(data)
      } else {
        toast({
          title: "Erro",
          description: "Falha ao carregar destinatários.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching recipients:", error)
      toast({
        title: "Erro",
        description: "Erro ao carregar destinatários.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddRecipient = async () => {
    if (!newEmail) return

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newEmail)) {
        toast({
            title: "Erro",
            description: "Por favor, insira um e-mail válido.",
            variant: "destructive",
        })
        return
    }

    try {
      const response = await fetch("/api/alerts/recipients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail }),
      })

      if (response.ok) {
        const newRecipient = await response.json()
        setRecipients([...recipients, newRecipient])
        setNewEmail("")
        toast({
          title: "Sucesso",
          description: "Destinatário adicionado.",
        })
      } else {
        const errorData = await response.json()
        toast({
          title: "Erro",
          description: errorData.error || "Falha ao adicionar destinatário.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error adding recipient:", error)
      toast({
        title: "Erro",
        description: "Erro ao adicionar destinatário.",
        variant: "destructive",
      })
    }
  }

  const handleUpdatePreference = async (id: number, key: keyof Preferences, value: boolean) => {
    const originalRecipients = [...recipients]

    // Optimistic update
    setRecipients(recipients.map(r => {
        if (r.id === id) {
            return {
                ...r,
                preferencias: {
                    ...(r.preferencias || { fogo: false, desmatamento: false, chuva: false, nivel_rio: false }),
                    [key]: value
                }
            }
        }
        return r
    }))

    try {
      const recipient = recipients.find(r => r.id === id);
      if (!recipient) return;

      const newPreferences = {
          ...(recipient.preferencias || { fogo: false, desmatamento: false, chuva: false, nivel_rio: false }),
          [key]: value
      };

      const response = await fetch(`/api/alerts/recipients/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferencias: newPreferences }),
      })

      if (!response.ok) {
        setRecipients(originalRecipients)
        toast({
          title: "Erro",
          description: "Falha ao atualizar preferência.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating preference:", error)
      setRecipients(originalRecipients)
      toast({
        title: "Erro",
        description: "Erro ao atualizar preferência.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteRecipient = async (id: number) => {
    if (!confirm("Tem certeza que deseja remover este e-mail?")) return

    const originalRecipients = [...recipients]
    setRecipients(recipients.filter((r) => r.id !== id))

    try {
      const response = await fetch(`/api/alerts/recipients/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        setRecipients(originalRecipients)
        toast({
          title: "Erro",
          description: "Falha ao remover destinatário.",
          variant: "destructive",
        })
      } else {
          toast({
          title: "Sucesso",
          description: "Destinatário removido.",
        })
      }
    } catch (error) {
      console.error("Error deleting recipient:", error)
      setRecipients(originalRecipients)
      toast({
        title: "Erro",
        description: "Erro ao remover destinatário.",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchRecipients()
    }
  }, [isOpen])

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-3xl bg-slate-950 border-white/10 text-slate-100 max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
        <div className="p-6 border-b border-white/10">
            <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Gerenciamento de Alertas</DialogTitle>
            <DialogDescription className="text-slate-400 mt-1.5">
                Configure quem receberá os alertas e quais tipos de notificação.
            </DialogDescription>
            </DialogHeader>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-2">
          {loading && recipients.length === 0 ? (
            <div className="text-center text-slate-400 py-8">Carregando...</div>
          ) : recipients.length === 0 ? (
            <div className="text-center text-slate-400 py-8">Nenhum destinatário cadastrado.</div>
          ) : (
            recipients.map((recipient) => (
              <div
                key={recipient.id}
                className="flex items-center justify-between p-4 rounded-lg bg-slate-900 border border-white/5 hover:border-white/10 transition-colors"
              >
                <div className="flex-1 min-w-0 mr-4">
                  <div className="font-medium truncate text-sm text-slate-200" title={recipient.email}>
                    {recipient.email}
                  </div>
                </div>

                <div className="flex items-center gap-6 mr-4">
                  <PreferenceToggle
                    icon={Flame}
                    active={recipient.preferencias?.fogo}
                    label="Fogo"
                    colorClass="text-orange-500"
                    activeBgClass="data-[state=checked]:bg-orange-600"
                    onToggle={(checked) => handleUpdatePreference(recipient.id, "fogo", checked)}
                  />
                  <PreferenceToggle
                    icon={Axe}
                    active={recipient.preferencias?.desmatamento}
                    label="Desmatamento"
                    colorClass="text-red-500"
                    activeBgClass="data-[state=checked]:bg-red-600"
                    onToggle={(checked) => handleUpdatePreference(recipient.id, "desmatamento", checked)}
                  />
                  <PreferenceToggle
                    icon={CloudRain}
                    active={recipient.preferencias?.chuva}
                    label="Chuva"
                    colorClass="text-blue-400"
                    activeBgClass="data-[state=checked]:bg-blue-500"
                    onToggle={(checked) => handleUpdatePreference(recipient.id, "chuva", checked)}
                  />
                  <PreferenceToggle
                    icon={Waves}
                    active={recipient.preferencias?.nivel_rio}
                    label="Nível do Rio"
                    colorClass="text-cyan-400"
                    activeBgClass="data-[state=checked]:bg-cyan-500"
                    onToggle={(checked) => handleUpdatePreference(recipient.id, "nivel_rio", checked)}
                  />
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteRecipient(recipient.id)}
                  className="text-slate-500 hover:text-red-400 hover:bg-red-500/10 h-8 w-8 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))
          )}
        </div>

        <div className="p-6 border-t border-white/10 bg-slate-900/50">
            <div className="flex gap-3 w-full items-end">
                <div className="flex-1 space-y-2">
                <Label htmlFor="new-email" className="text-xs font-medium text-slate-400 ml-1">Adicionar novo e-mail</Label>
                <div className="relative">
                    <Input
                        id="new-email"
                        placeholder="email@exemplo.com"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        className="bg-slate-950 border-white/10 focus:border-brand-primary h-10"
                        onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddRecipient();
                        }}
                    />
                </div>
                </div>
                <Button
                    onClick={handleAddRecipient}
                    disabled={!newEmail || loading}
                    className="bg-brand-primary hover:bg-brand-primary/90 h-10 px-6 font-medium"
                >
                Adicionar
                </Button>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function PreferenceToggle({
    icon: Icon,
    active,
    label,
    colorClass,
    activeBgClass,
    onToggle
}: {
    icon: any,
    active: boolean,
    label: string,
    colorClass: string,
    activeBgClass: string,
    onToggle: (checked: boolean) => void
}) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <div className="flex flex-col items-center gap-2 group cursor-pointer" onClick={() => onToggle(!active)}>
                    <Icon className={`w-4 h-4 transition-colors ${active ? colorClass : "text-slate-600 group-hover:text-slate-500"}`} />
                    <Switch
                        checked={active}
                        onCheckedChange={onToggle}
                        className={`scale-75 ${activeBgClass} border-white/10`}
                    />
                </div>
            </TooltipTrigger>
            <TooltipContent className="bg-slate-900 text-white border-white/10 text-xs font-medium">
                <p>{label}</p>
            </TooltipContent>
        </Tooltip>
    )
}
