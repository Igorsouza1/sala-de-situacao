"use client"

import { useState, useEffect } from "react"
import { Lock, Eye, EyeOff, Edit3, Save, X, Shield } from "lucide-react"
import { createClient } from "@/utils/supabase/client"

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"

interface UserProfileModalProps {
  isOpen: boolean
  onClose: () => void
}

interface UserProfile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
}

export function UserProfileModal({ isOpen, onClose }: UserProfileModalProps) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [editMode, setEditMode] = useState<"none" | "personal" | "password">("none")

  // Estados para visualização/edição
  const [displayName, setDisplayName] = useState("")
  const [editName, setEditName] = useState("")

  // Estados para alteração de senha
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  })

  const supabase = createClient()
  const { toast } = useToast()

  // Buscar dados do usuário
  useEffect(() => {
    if (isOpen) {
      fetchUserProfile()
    }
  }, [isOpen])

  // Reset states when modal closes
  useEffect(() => {
    if (!isOpen) {
      setEditMode("none")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setShowPasswords({ current: false, new: false, confirm: false })
    }
  }, [isOpen])

  const fetchUserProfile = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const userProfile: UserProfile = {
          id: user.id,
          email: user.email || "",
          full_name: user.user_metadata?.full_name || null,
          avatar_url: user.user_metadata?.avatar_url || null,
          created_at: user.created_at,
        }

        setUserProfile(userProfile)
        setDisplayName(userProfile.full_name || "")
        setEditName(userProfile.full_name || "")
      }
    } catch (error) {
      console.error("Erro ao buscar perfil:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados do perfil.",
        variant: "destructive",
      })
    }
  }

  const handleUpdateProfile = async () => {
    if (!userProfile) return

    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: editName },
      })

      if (error) throw error

      toast({
        title: "Sucesso",
        description: "Nome atualizado com sucesso!",
      })

      setUserProfile((prev) => (prev ? { ...prev, full_name: editName } : null))
      setDisplayName(editName)
      setEditMode("none")
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar nome.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem.",
        variant: "destructive",
      })
      return
    }

    if (newPassword.length < 6) {
      toast({
        title: "Erro",
        description: "A nova senha deve ter pelo menos 6 caracteres.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) throw error

      toast({
        title: "Sucesso",
        description: "Senha alterada com sucesso!",
      })

      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setEditMode("none")
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao alterar senha.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getInitials = (name: string | null) => {
    if (!name) return "U"
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }

  const handleClose = () => {
    setEditMode("none")
    onClose()
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose()
      }}
    >
      <DialogContent className="max-w-md w-[95vw] max-h-[95vh] p-0 bg-pantaneiro-green border-0 shadow-2xl overflow-hidden">
        {/* Header */}
        <DialogTitle className="sr-only">Acessar Perfil</DialogTitle>
        <div className="relative bg-gradient-to-br from-slate-700 via-slate-600 to-slate-700 h-32 rounded-t-lg">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white hover:bg-white/20 rounded-full h-8 w-8 transition-all duration-200"
          >
            <X className="w-4 h-4" />
          </Button>

          {/* Círculo do avatar sem foto */}
          <div className="absolute -bottom-8 left-6">
            <div className="w-16 h-16 bg-pantaneiro-lime rounded-full border-4 border-pantaneiro-green flex items-center justify-center">
              <span className="text-pantaneiro-green text-xl font-semibold">{getInitials(displayName)}</span>
            </div>
          </div>
        </div>

        {/* Conteúdo principal */}
        <div className="px-6 pt-12 pb-6 space-y-6">
          {/* User Info */}
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

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-white/50 text-xs uppercase tracking-wide">Membro desde</p>
              <p className="text-white font-medium">
                {userProfile?.created_at ? formatDate(userProfile.created_at) : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-white/50 text-xs uppercase tracking-wide">Status</p>
              <p className="text-pantaneiro-lime font-medium">Ativo</p>
            </div>
          </div>

          {/* Informações Pessoais */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-medium">Informações Pessoais</h3>
              {editMode !== "personal" && (
                <Button
                  variant="ghost"
                  size="sm"
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
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-pantaneiro-lime focus:ring-pantaneiro-lime/20 h-10"
                    placeholder="Digite seu nome completo"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleUpdateProfile}
                    disabled={loading}
                    className="bg-pantaneiro-lime hover:bg-pantaneiro-lime/90 text-pantaneiro-green h-9 px-4 text-sm font-medium flex-1"
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
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-pantaneiro-lime rounded-full"></div>
                  <div>
                    <p className="text-white/50 text-xs">Nome completo</p>
                    <p className="text-white text-sm">{displayName || "Não informado"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-pantaneiro-lime rounded-full"></div>
                  <div>
                    <p className="text-white/50 text-xs">Email</p>
                    <p className="text-white text-sm">{userProfile?.email}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Segurança */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-medium">Segurança</h3>
              {editMode !== "password" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditMode("password")}
                  className="text-white/70 hover:text-white hover:bg-white/10 h-8 px-3"
                >
                  <Lock className="w-3 h-3 mr-1" />
                  Alterar
                </Button>
              )}
            </div>

            {editMode === "password" ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword" className="text-white/70 text-sm">
                    Senha Atual
                  </Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showPasswords.current ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-pantaneiro-lime focus:ring-pantaneiro-lime/20 h-10 pr-10"
                      placeholder="Digite sua senha atual"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 text-white/50 hover:text-white/80"
                      onClick={() => setShowPasswords((prev) => ({ ...prev, current: !prev.current }))}
                    >
                      {showPasswords.current ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-white/70 text-sm">
                    Nova Senha
                  </Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPasswords.new ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-pantaneiro-lime focus:ring-pantaneiro-lime/20 h-10 pr-10"
                      placeholder="Digite sua nova senha"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 text-white/50 hover:text-white/80"
                      onClick={() => setShowPasswords((prev) => ({ ...prev, new: !prev.new }))}
                    >
                      {showPasswords.new ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-white/70 text-sm">
                    Confirmar Nova Senha
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showPasswords.confirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-pantaneiro-lime focus:ring-pantaneiro-lime/20 h-10 pr-10"
                      placeholder="Confirme sua nova senha"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 text-white/50 hover:text-white/80"
                      onClick={() => setShowPasswords((prev) => ({ ...prev, confirm: !prev.confirm }))}
                    >
                      {showPasswords.confirm ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    </Button>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={handleUpdatePassword}
                    disabled={loading || !currentPassword || !newPassword || !confirmPassword}
                    className="bg-pantaneiro-lime hover:bg-pantaneiro-lime/90 text-pantaneiro-green h-9 px-4 text-sm font-medium flex-1"
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
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-pantaneiro-lime rounded-full"></div>
                <div>
                  <p className="text-white/50 text-xs">Senha</p>
                  <p className="text-white text-sm">••••••••••</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
