"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Plus, Map, BarChartIcon as ChartNetwork, HardDrive, User, Settings, LogOut, Globe } from "lucide-react"
import { useRegiao } from "@/context/RegiaoContext"
import { type Regiao } from "@/db/schema"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

import { useUserRole } from "@/hooks/useUserRole"
import { createClient } from "@/utils/supabase/client"
  import { DataInsertDialog } from "@/components/data-insert/DataInsertDialog"
import { UserProfileModal } from "@/components/user-profile-modal"

/* ───────── itens de navegação ───────── */
const commonNavItems = [
  { name: "Mapa", href: "/protected", icon: Map },
  { name: "Dashboard", href: "/protected/dashboard", icon: ChartNetwork },
]

// const adminNavItems = [{ name: "Painel do Administrador", href: "/protected/admin/data", icon: HardDrive }]

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { isAdmin, isLoading } = useUserRole()
  const supabase = createClient()
  const { selectedRegionId, setSelectedRegionId } = useRegiao()
  const [regioes, setRegioes] = useState<Regiao[]>([])
  const [isRegiaoMenuOpen, setIsRegiaoMenuOpen] = useState(false)

  useEffect(() => {
    const fetchRegioes = async () => {
      try {
        const response = await fetch('/api/regioes');
        if (!response.ok) {
          throw new Error('Falha ao buscar regiões');
        }
        const data: Regiao[] = await response.json();
        setRegioes(data);
        if (data.length > 0 && !selectedRegionId) {
          setSelectedRegionId(data[0].id); // Seleciona a primeira região por padrão
        }
      } catch (error) {
        console.error(error);
      }
    };
    fetchRegioes();
  }, [selectedRegionId, setSelectedRegionId]);

  const [isGpxModalOpen, setIsGpxModalOpen] = useState(false)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)

  // ⬇️  controle explícito do dropdown
  const [menuOpen, setMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.refresh()
  }

  const navItems = isLoading ? commonNavItems : [...commonNavItems]

  const openProfile = () => {
    setMenuOpen(false)               // fecha o dropdown imediatamente
    setIsProfileModalOpen(true)      // abre a modal depois
  }

  return (
    <TooltipProvider>
      <nav className="flex flex-col h-screen w-16 bg-pantaneiro-green sticky top-0 left-0 shadow-md z-50">
        <div className="flex-1 flex flex-col items-center pt-6 gap-6">
          {/* Seletor de Região */}
          <DropdownMenu open={isRegiaoMenuOpen} onOpenChange={setIsRegiaoMenuOpen}>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="p-2 rounded-lg text-white transition-colors duration-200 hover:bg-pantaneiro-lime hover:bg-opacity-20"
                    aria-label="Selecionar Região"
                  >
                    <Globe className="w-5 h-5" strokeWidth={1.5} />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-pantaneiro-lime text-pantaneiro-green">
                <p>
                  {regioes.find(r => r.id === selectedRegionId)?.nome || "Selecionar Região"}
                </p>
              </TooltipContent>
            </Tooltip>
            <DropdownMenuContent side="right" className="w-56 bg-pantaneiro-green text-white z-[1000]">
              {regioes.map((regiao) => (
                <DropdownMenuItem
                  key={regiao.id}
                  className="flex items-center gap-2 hover:bg-pantaneiro-lime hover:bg-opacity-20"
                  onSelect={() => setSelectedRegionId(regiao.id)}
                >
                  <span>{regiao.nome}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* links de navegação */}
          {navItems.map((item) => (
            <Tooltip key={item.name}>
              <TooltipTrigger asChild>
                <Link
                  href={item.href} 
                  className={`p-2 rounded-lg transition-colors duration-200 ${
                    pathname === item.href
                      ? "bg-pantaneiro-lime text-pantaneiro-green"
                      : "text-white hover:bg-pantaneiro-lime hover:bg-opacity-20"
                  }`}
                >
                  <item.icon className="w-5 h-5" strokeWidth={1.5} />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-pantaneiro-lime text-pantaneiro-green">
                <p>{item.name}</p>
              </TooltipContent>
            </Tooltip>
          ))}

          {/* botão de upload GPX (só admins) */}
          {isAdmin && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsGpxModalOpen(true)}
                  className="p-2 rounded-lg text-white transition-colors duration-200 hover:bg-pantaneiro-lime hover:bg-opacity-20"
                  aria-label="Upload GPX"
                >
                  <Plus className="w-5 h-5" strokeWidth={1.5} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-pantaneiro-lime text-pantaneiro-green">
                <p>Upload GPX</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* avatar / menu do usuário */}
        <div className="flex flex-col items-center mb-6">
          <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-lg p-2 text-white hover:bg-pantaneiro-lime hover:bg-opacity-20"
              >
                <Avatar className="w-8 h-8">
                  <AvatarImage src="https://github.com/shadcn.png" />
                  <AvatarFallback className="bg-pantaneiro-lime text-pantaneiro-green">CN</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" className="w-56 bg-pantaneiro-green text-white z-[1000]">
              <DropdownMenuItem
                className="flex items-center gap-2 hover:bg-pantaneiro-lime hover:bg-opacity-20"
                onSelect={(e) => {
                  e.preventDefault()
                  openProfile()
                }}
              >
                <User className="w-4 h-4" />
                <span>Perfil</span>
              </DropdownMenuItem>

              <DropdownMenuItem className="flex items-center gap-2 hover:bg-pantaneiro-lime hover:bg-opacity-20">
                <Settings className="w-4 h-4" />
                <span>Configurações</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                className="flex items-center gap-2 hover:bg-pantaneiro-lime hover:bg-opacity-20"
                onSelect={handleSignOut}
              >
                <LogOut className="w-4 h-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>

      {/* modal de upload GPX */}
      <DataInsertDialog isOpen={isGpxModalOpen} onClose={() => setIsGpxModalOpen(false)} />

      {/* modal de perfil do usuário */}
      <UserProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />
    </TooltipProvider>
  )
}
