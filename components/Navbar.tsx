"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Plus, Map, BarChartIcon as ChartNetwork,  User, Settings, LogOut, UserCog } from "lucide-react"

import { Avatar } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

import { useUserRole } from "@/hooks/useUserRole"
import { createClient } from "@/lib/supabase/client"
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
      <nav className="flex flex-col h-screen w-16 bg-brand-dark border-r border-white/5 sticky top-0 left-0 z-50">
        <div className="flex-1 flex flex-col items-center pt-6 gap-6">
          {/* links de navegação */}
          {navItems.map((item) => (
            <Tooltip key={item.name}>
              <TooltipTrigger asChild>
                <Link
                  href={item.href} 
                  className={`p-2.5 rounded-xl transition-all duration-300 ${
                    pathname === item.href
                      ? "bg-brand-primary text-white shadow-[0_0_15px_rgba(59,130,246,0.4)]"
                      : "text-slate-400 hover:bg-brand-primary/10 hover:text-brand-primary"
                  }`}
                >
                  <item.icon className="w-5 h-5" strokeWidth={1.5} />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-brand-dark border border-white/10 text-white">
                <p className="font-medium text-xs">{item.name}</p>
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
                  className="p-2.5 rounded-xl text-slate-400 transition-all duration-300 hover:bg-brand-primary/10 hover:text-brand-primary"
                  aria-label="Upload GPX"
                >
                  <Plus className="w-5 h-5" strokeWidth={1.5} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-brand-dark border border-white/10 text-white">
                <p className="font-medium text-xs">Upload GPX</p>
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
                className="rounded-xl p-2 text-slate-400 hover:bg-brand-primary/10 hover:text-brand-primary transition-all duration-300"
              >
                
                <Avatar className="w-9 h-9 border border-white/10 flex items-center justify-center">
                  <UserCog className="w-5 h-5" />
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" className="w-56 bg-brand-dark border border-white/10 text-slate-200 z-[1000] shadow-xl shadow-black/50">
              <DropdownMenuItem
                className="flex items-center gap-2 cursor-pointer focus:bg-brand-primary/10 focus:text-brand-primary"
                onSelect={(e) => {
                  e.preventDefault()
                  openProfile()
                }}
              >
                <User className="w-4 h-4" />
                <span>Perfil</span>
              </DropdownMenuItem>

              <DropdownMenuItem className="flex items-center gap-2 cursor-pointer focus:bg-brand-primary/10 focus:text-brand-primary">
                <Settings className="w-4 h-4" />
                <span>Configurações</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                className="flex items-center gap-2 cursor-pointer text-red-400 focus:bg-red-500/10 focus:text-red-400"
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
