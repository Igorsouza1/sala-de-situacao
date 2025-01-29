"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Plus, Map, BarChartIcon as ChartNetwork, HardDrive, User, Settings, LogOut } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useUserRole } from "@/hooks/useUserRole"
import { createClient } from "@/utils/supabase/client"

const commonNavItems = [
  { name: "Mapa", href: "/search", icon: Map },
  { name: "Dashboard", href: "/", icon: ChartNetwork },
]

const adminNavItems = [
  { name: "Painel do Administrador", href: "/admin", icon: HardDrive },
  { name: "Adicionar", href: "/add", icon: Plus },
]

export function Navbar() {
  const pathname = usePathname()
  const { isAdmin, isLoading } = useUserRole()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  // Only show nav items after role check is complete
  const navItems = isLoading ? commonNavItems : [...commonNavItems, ...(isAdmin ? adminNavItems : [])]

  return (
    <TooltipProvider>
      <nav className="flex flex-col h-screen w-16 bg-pantaneiro-green z-50">
        <div className="flex-1 flex flex-col items-center pt-6 gap-6">
          {navItems.map((item) => (
            <Tooltip key={item.name}>
              <TooltipTrigger asChild>
                <Link
                  href={item.href}
                  className={`p-2 rounded-lg transition-colors duration-200
                    ${
                      pathname === item.href
                        ? "bg-pantaneiro-lime text-pantaneiro-green"
                        : "text-white hover:bg-pantaneiro-lime hover:bg-opacity-20"
                    }`}
                >
                  <item.icon className="w-5 h-5" strokeWidth={1.5} />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-pantaneiro-lime text-pantaneiro-green ">
                <p>{item.name}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>

        <div className="flex flex-col items-center mb-6">
          <DropdownMenu>
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
              <DropdownMenuItem className="flex items-center gap-2 hover:bg-pantaneiro-lime hover:bg-opacity-20">
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
    </TooltipProvider>
  )
}

