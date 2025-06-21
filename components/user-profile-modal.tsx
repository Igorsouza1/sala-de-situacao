"use client"

import { useState, useEffect } from "react"
import { User, Lock, Eye, EyeOff, Edit3, Save, X, Mail, Calendar } from "lucide-react"
import { createClient } from "@/utils/supabase/client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
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
        title: "✅ Sucesso",
        description: "Nome atualizado com sucesso!",
      })

      setUserProfile((prev) => (prev ? { ...prev, full_name: editName } : null))
      setDisplayName(editName)
      setEditMode("none")
    } catch (error: any) {
      toast({
        title: "❌ Erro",
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
        title: "❌ Erro",
        description: "As senhas não coincidem.",
        variant: "destructive",
      })
      return
    }

    if (newPassword.length < 6) {
      toast({
        title: "❌ Erro",
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
        title: "✅ Sucesso",
        description: "Senha alterada com sucesso!",
      })

      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setEditMode("none")
    } catch (error: any) {
      toast({
        title: "❌ Erro",
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
      month: "long",
      year: "numeric",
    })
  }

  const handleClose = () => {
    setEditMode("none")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open) handleClose()
      }}>
        
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-hidden p-0 bg-gradient-to-br from-pantaneiro-green to-pantaneiro-green/90">
        {/* Header com gradiente */}
        <div className="relative bg-pantaneiro-green p-8 text-white">
          <DialogHeader className="space-y-0">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-6">
                <Avatar className="w-24 h-24 border-4 border-pantaneiro-lime shadow-xl">
                  <AvatarImage src={userProfile?.avatar_url || ""} />
                  <AvatarFallback className="bg-pantaneiro-lime text-pantaneiro-green text-2xl font-bold">
                  </AvatarFallback>
                </Avatar>

                <div className="space-y-2">
                  <DialogTitle className="text-3xl font-bold text-white">
                    {displayName || "Nome não informado"}
                  </DialogTitle>
                  <div className="flex items-center gap-2 text-pantaneiro-lime">
                    <Mail className="w-4 h-4" />
                    <span className="text-lg">{userProfile?.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-pantaneiro-lime/80">
                    <Calendar className="w-4 h-4" />
                    <span>Membro desde {userProfile?.created_at ? formatDate(userProfile.created_at) : "N/A"}</span>
                  </div>
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="text-white hover:bg-white/20 rounded-full"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </DialogHeader>
        </div>

        {/* Conteúdo principal */}
        <div className="flex-1 bg-white p-8 space-y-8 overflow-y-auto max-h-[60vh]">
          {/* Seção de Informações Pessoais */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-pantaneiro-green/10 rounded-lg">
                  <User className="w-5 h-5 text-pantaneiro-green" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Informações Pessoais</h3>
                  <p className="text-gray-600">Gerencie seus dados básicos</p>
                </div>
              </div>

              {editMode !== "personal" && (
                <Button
                  variant="outline"
                  onClick={() => setEditMode("personal")}
                  className="border-pantaneiro-green text-pantaneiro-green hover:bg-pantaneiro-green hover:text-white"
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Editar
                </Button>
              )}
            </div>

            <div className="bg-gray-50 rounded-xl p-6 space-y-4">
              {editMode === "personal" ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="editName" className="text-sm font-medium text-gray-700">
                      Nome Completo
                    </Label>
                    <Input
                      id="editName"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="mt-1 border-gray-300 focus:border-pantaneiro-green focus:ring-pantaneiro-green"
                      placeholder="Digite seu nome completo"
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={handleUpdateProfile}
                      disabled={loading}
                      className="bg-pantaneiro-green hover:bg-pantaneiro-green/90 text-white"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {loading ? "Salvando..." : "Salvar"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditMode("none")
                        setEditName(displayName)
                      }}
                      className="border-gray-300"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Nome Completo</Label>
                    <p className="text-lg font-medium text-gray-900 mt-1">{displayName || "Não informado"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Email</Label>
                    <p className="text-lg font-medium text-gray-900 mt-1">{userProfile?.email}</p>
                    <Badge variant="secondary" className="mt-1 bg-green-100 text-green-800">
                      Verificado
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Seção de Segurança */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-50 rounded-lg">
                  <Lock className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Segurança</h3>
                  <p className="text-gray-600">Altere sua senha de acesso</p>
                </div>
              </div>

              {editMode !== "password" && (
                <Button
                  variant="outline"
                  onClick={() => setEditMode("password")}
                  className="border-red-500 text-red-600 hover:bg-red-500 hover:text-white"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Alterar Senha
                </Button>
              )}
            </div>

            <div className="bg-gray-50 rounded-xl p-6">
              {editMode === "password" ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="currentPassword" className="text-sm font-medium text-gray-700">
                      Senha Atual
                    </Label>
                    <div className="relative mt-1">
                      <Input
                        id="currentPassword"
                        type={showPasswords.current ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="border-gray-300 focus:border-pantaneiro-green focus:ring-pantaneiro-green pr-10"
                        placeholder="Digite sua senha atual"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                        onClick={() => setShowPasswords((prev) => ({ ...prev, current: !prev.current }))}
                      >
                        {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="newPassword" className="text-sm font-medium text-gray-700">
                      Nova Senha
                    </Label>
                    <div className="relative mt-1">
                      <Input
                        id="newPassword"
                        type={showPasswords.new ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="border-gray-300 focus:border-pantaneiro-green focus:ring-pantaneiro-green pr-10"
                        placeholder="Digite sua nova senha"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                        onClick={() => setShowPasswords((prev) => ({ ...prev, new: !prev.new }))}
                      >
                        {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                      Confirmar Nova Senha
                    </Label>
                    <div className="relative mt-1">
                      <Input
                        id="confirmPassword"
                        type={showPasswords.confirm ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="border-gray-300 focus:border-pantaneiro-green focus:ring-pantaneiro-green pr-10"
                        placeholder="Confirme sua nova senha"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                        onClick={() => setShowPasswords((prev) => ({ ...prev, confirm: !prev.confirm }))}
                      >
                        {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">Dicas para uma senha segura:</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Pelo menos 8 caracteres</li>
                      <li>• Combine letras maiúsculas e minúsculas</li>
                      <li>• Inclua números e símbolos</li>
                      <li>• Evite informações pessoais</li>
                    </ul>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={handleUpdatePassword}
                      disabled={loading || !currentPassword || !newPassword || !confirmPassword}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {loading ? "Alterando..." : "Alterar Senha"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditMode("none")
                        setCurrentPassword("")
                        setNewPassword("")
                        setConfirmPassword("")
                      }}
                      className="border-gray-300"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Lock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Sua senha está protegida e criptografada.</p>
                  <p className="text-sm text-gray-500 mt-1">Última alteração: Não disponível</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
