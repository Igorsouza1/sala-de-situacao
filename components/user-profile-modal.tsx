"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Lock, Eye, EyeOff, Edit3, Save, X, Shield } from "lucide-react"

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton" // shadcn skeleton

import { createClient } from "@/utils/supabase/client" // ‼️  **ainda usado só para trocar a senha**

/* ──────────────────────────
   Tipagens
───────────────────────────*/
interface UserProfileModalProps {
  isOpen: boolean
  onClose: () => void
}

interface UserProfile {
  id: string
  email: string
  full_name: string | null
  created_at: string
}

/* ──────────────────────────
   Componente
───────────────────────────*/
export function UserProfileModal({ isOpen, onClose }: UserProfileModalProps) {
  /* estado global */
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [editMode, setEditMode] = useState<"none" | "personal" | "password">("none")
  const [initialLoading, setInitialLoading] = useState(true)

  /* sub-estados */
  const [displayName, setDisplayName] = useState("")
  const [editName, setEditName] = useState("")

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false })

  const { toast } = useToast()
  const supabase = createClient() // só para senha

  /* ───────── helpers ───────── */
  const getInitials = (name: string | null) =>
    !name
      ? "U"
      : name
          .split(" ")
          .map((w) => w[0])
          .join("")
          .toUpperCase()
          .slice(0, 2)

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })

  /* ───────── API calls ───────── */
  const fetchUserProfile = async () => {
    setInitialLoading(true)
    try {
      const res = await fetch("/api/user", { cache: "no-store" })
      if (!res.ok) throw new Error("Falha ao buscar perfil")
      const data: UserProfile = await res.json()
      setUserProfile(data)
      setDisplayName(data.full_name || "")
      setEditName(data.full_name || "")
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" })
    } finally {
      setInitialLoading(false)
    }
  }

  const patchProfile = async (payload: Partial<{ full_name: string; email: string }>) => {
    const res = await fetch("/api/user", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const { error } = await res.json()
      throw new Error(error || "Erro ao atualizar")
    }
  }

  /* ───────── side-effects ───────── */
  useEffect(() => {
    if (isOpen) fetchUserProfile()
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) {
      setEditMode("none")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setShowPasswords({ current: false, new: false, confirm: false })
    }
  }, [isOpen])

  /* ───────── ações ───────── */
  const handleUpdateProfile = async () => {
    if (!editName.trim() || editName === displayName) return setEditMode("none")

    setLoading(true)
    try {
      await patchProfile({ full_name: editName })
      toast({ title: "Sucesso", description: "Nome atualizado!" })
      setDisplayName(editName)
      setEditMode("none")
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePassword = async () => {
    if (newPassword !== confirmPassword)
      return toast({ title: "Erro", description: "Senhas não coincidem.", variant: "destructive" })
    if (newPassword.length < 6)
      return toast({ title: "Erro", description: "Mínimo 6 caracteres.", variant: "destructive" })

    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      toast({ title: "Sucesso", description: "Senha alterada!" })
      setEditMode("none")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setEditMode("none")
    onClose()
  }

  /* UI */

  /* ──────────────────────────
     JSX
  ──────────────────────────*/
  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-md w-[95vw] max-h-[95vh] p-0 bg-pantaneiro-green border-0 shadow-2xl overflow-hidden">
        <DialogTitle className="sr-only">Perfil</DialogTitle>

        {/* HEADER */}
        <div className="relative bg-gradient-to-br from-slate-700 via-slate-600 to-slate-700 h-32 rounded-t-lg">
          <Button
            size="icon"
            variant="ghost"
            onClick={handleClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white hover:bg-white/20 rounded-full h-8 w-8"
          >
            <X className="w-4 h-4" />
          </Button>

          {/* Avatar fake */}
          <div className="absolute -bottom-8 left-6 w-16 h-16 bg-pantaneiro-lime rounded-full border-4 border-pantaneiro-green flex items-center justify-center">
            <span className="text-pantaneiro-green text-xl font-semibold">{getInitials(displayName)}</span>
          </div>
        </div>

        {/* BODY */}
        <div className="px-6 pt-12 pb-6 space-y-6 overflow-y-auto max-h-[70vh]">
          {initialLoading ? (
            /* Skeleton Loading */
            <div className="space-y-6">
              {/* info básica skeleton */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-6 w-48 bg-white/20" />
                  <Skeleton className="h-5 w-20 bg-white/20 rounded-full" />
                </div>
                <Skeleton className="h-4 w-64 bg-white/20" />
              </div>

              {/* stats skeleton */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Skeleton className="h-3 w-24 bg-white/20" />
                  <Skeleton className="h-4 w-20 bg-white/20" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-3 w-16 bg-white/20" />
                  <Skeleton className="h-4 w-12 bg-white/20" />
                </div>
              </div>

              {/* informações pessoais skeleton */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-5 w-40 bg-white/20" />
                  <Skeleton className="h-8 w-16 bg-white/20 rounded" />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-2 h-2 bg-white/20 rounded-full" />
                    <div className="space-y-1">
                      <Skeleton className="h-3 w-24 bg-white/20" />
                      <Skeleton className="h-4 w-32 bg-white/20" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-2 h-2 bg-white/20 rounded-full" />
                    <div className="space-y-1">
                      <Skeleton className="h-3 w-16 bg-white/20" />
                      <Skeleton className="h-4 w-48 bg-white/20" />
                    </div>
                  </div>
                </div>
              </div>

              {/* segurança skeleton */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-5 w-24 bg-white/20" />
                  <Skeleton className="h-8 w-16 bg-white/20 rounded" />
                </div>
                <div className="flex items-center gap-3">
                  <Skeleton className="w-2 h-2 bg-white/20 rounded-full" />
                  <div className="space-y-1">
                    <Skeleton className="h-3 w-16 bg-white/20" />
                    <Skeleton className="h-4 w-24 bg-white/20" />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Conteúdo normal quando carregado */
            <>
              {/* info básica */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-semibold text-white">{displayName || "Nome não informado"}</h1>
                  <Badge className="bg-pantaneiro-lime/20 text-pantaneiro-lime border-pantaneiro-lime/30 text-xs">
                    <Shield className="w-3 h-3 mr-1" />
                    Verificado
                  </Badge>
                </div>
                <p className="text-white/70 text-sm">{userProfile?.email}</p>
              </div>

              {/* stats */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-white/50 text-xs uppercase">Membro desde</p>
                  <p className="text-white font-medium">
                    {userProfile?.created_at ? formatDate(userProfile.created_at) : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-white/50 text-xs uppercase">Status</p>
                  <p className="text-pantaneiro-lime font-medium">Ativo</p>
                </div>
              </div>

              {/* ───── Informações pessoais ───── */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-medium">Informações Pessoais</h3>
                  {editMode !== "personal" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditMode("personal")}
                      className="text-white/70 hover:text-white hover:bg-white/10 h-8 px-3"
                    >
                      <Edit3 className="w-3 h-3 mr-1" />
                      Editar
                    </Button>
                  )}
                </div>

                {editMode === "personal" ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="editName" className="text-white/70 text-sm">
                        Nome Completo
                      </Label>
                      <Input
                        id="editName"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Digite seu nome completo"
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-pantaneiro-lime focus:ring-pantaneiro-lime/20 h-10"
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        disabled={loading}
                        onClick={handleUpdateProfile}
                        className="bg-pantaneiro-lime hover:bg-pantaneiro-lime/90 text-pantaneiro-green h-9 flex-1"
                      >
                        <Save className="w-3 h-3 mr-1" />
                        {loading ? "Salvando..." : "Salvar"}
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setEditMode("none")
                          setEditName(displayName)
                        }}
                        className="text-white/70 hover:text-white hover:bg-white/10 h-9 px-4 text-sm"
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <PersonalItem label="Nome completo" value={displayName || "Não informado"} />
                    <PersonalItem label="Email" value={userProfile?.email ?? ""} />
                  </div>
                )}
              </div>

              {/* ───── Segurança ───── */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-medium">Segurança</h3>
                  {editMode !== "password" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditMode("password")}
                      className="text-white/70 hover:text-white hover:bg-white/10 h-8 px-3"
                    >
                      <Lock className="w-3 h-3 mr-1" />
                      Alterar
                    </Button>
                  )}
                </div>

                {editMode === "password" ? (
                  <PasswordForm
                    showPasswords={showPasswords}
                    setShowPasswords={setShowPasswords}
                    currentPassword={currentPassword}
                    setCurrentPassword={setCurrentPassword}
                    newPassword={newPassword}
                    setNewPassword={setNewPassword}
                    confirmPassword={confirmPassword}
                    setConfirmPassword={setConfirmPassword}
                  >
                    <div className="flex gap-2 pt-2">
                      <Button
                        disabled={loading || !currentPassword || !newPassword || !confirmPassword}
                        onClick={handleUpdatePassword}
                        className="bg-pantaneiro-lime hover:bg-pantaneiro-lime/90 text-pantaneiro-green h-9 flex-1"
                      >
                        <Save className="w-3 h-3 mr-1" />
                        {loading ? "Alterando..." : "Alterar Senha"}
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setEditMode("none")
                          setCurrentPassword("")
                          setNewPassword("")
                          setConfirmPassword("")
                        }}
                        className="text-white/70 hover:text-white hover:bg-white/10 h-9 px-4 text-sm"
                      >
                        Cancelar
                      </Button>
                    </div>
                  </PasswordForm>
                ) : (
                  <PersonalItem label="Senha" value="••••••••••" />
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

/* ──────────────────────────
   Sub-componentes utilitários
───────────────────────────*/
function PersonalItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-2 h-2 bg-pantaneiro-lime rounded-full" />
      <div>
        <p className="text-white/50 text-xs">{label}</p>
        <p className="text-white text-sm">{value}</p>
      </div>
    </div>
  )
}

interface PasswordFormProps {
  showPasswords: { current: boolean; new: boolean; confirm: boolean }
  setShowPasswords: React.Dispatch<React.SetStateAction<{ current: boolean; new: boolean; confirm: boolean }>>
  currentPassword: string
  setCurrentPassword: (s: string) => void
  newPassword: string
  setNewPassword: (s: string) => void
  confirmPassword: string
  setConfirmPassword: (s: string) => void
  children: React.ReactNode
}

function PasswordForm({
  showPasswords,
  setShowPasswords,
  currentPassword,
  setCurrentPassword,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  children,
}: PasswordFormProps) {
  return (
    <div className="space-y-4">
      {/* senha atual */}
      <PasswordInput
        id="currentPassword"
        label="Senha Atual"
        value={currentPassword}
        onChange={(e) => setCurrentPassword(e.target.value)}
        visible={showPasswords.current}
        toggle={() => setShowPasswords((p) => ({ ...p, current: !p.current }))}
      />

      {/* nova senha */}
      <PasswordInput
        id="newPassword"
        label="Nova Senha"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        visible={showPasswords.new}
        toggle={() => setShowPasswords((p) => ({ ...p, new: !p.new }))}
      />

      {/* confirmar */}
      <PasswordInput
        id="confirmPassword"
        label="Confirmar Nova Senha"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        visible={showPasswords.confirm}
        toggle={() => setShowPasswords((p) => ({ ...p, confirm: !p.confirm }))}
      />

      {children}
    </div>
  )
}

interface PasswordInputProps {
  id: string
  label: string
  value: string
  onChange: React.ChangeEventHandler<HTMLInputElement>
  visible: boolean
  toggle: () => void
}

function PasswordInput({ id, label, value, onChange, visible, toggle }: PasswordInputProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-white/70 text-sm">
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder={label}
          className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-pantaneiro-lime focus:ring-pantaneiro-lime/20 h-10 pr-10"
        />
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 text-white/50 hover:text-white/80"
          onClick={toggle}
        >
          {visible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
        </Button>
      </div>
    </div>
  )
}
