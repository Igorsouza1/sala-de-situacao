"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface ContactModalProps {
  children: React.ReactNode
}

export function ContactModal({ children }: ContactModalProps) {
  const [open, setOpen] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Here you would typically send the data to your backend
    // For now, we'll just simulate a success and close the modal
    setTimeout(() => {
        setOpen(false)
        alert("Mensagem enviada com sucesso! Entraremos em contato em breve.")
    }, 500)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-slate-900 border-white/10 text-slate-200">
        <DialogHeader>
          <DialogTitle className="text-white">Entre em Contato</DialogTitle>
          <DialogDescription className="text-slate-400">
            Preencha o formulário abaixo para agendar uma apresentação ou solicitar uma demonstração.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name" className="text-slate-300">
              Nome
            </Label>
            <Input
              id="name"
              placeholder="Seu nome completo"
              className="bg-slate-950 border-white/10 text-white placeholder:text-slate-600 focus-visible:ring-brand-primary/50"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email" className="text-slate-300">
              E-mail
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              className="bg-slate-950 border-white/10 text-white placeholder:text-slate-600 focus-visible:ring-brand-primary/50"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="message" className="text-slate-300">
              Mensagem
            </Label>
            <Textarea
              id="message"
              placeholder="Como podemos ajudar?"
              className="bg-slate-950 border-white/10 text-white placeholder:text-slate-600 focus-visible:ring-brand-primary/50 min-h-[100px]"
              required
            />
          </div>
          <DialogFooter>
            <Button type="submit" className="bg-brand-primary hover:bg-blue-600 text-white w-full sm:w-auto">
              Enviar Mensagem
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
