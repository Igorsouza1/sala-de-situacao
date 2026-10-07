'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { LogOut, ShieldCheck, User } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { UserProfileModal } from '@/components/user-profile-modal'
import { useUserRole } from '@/hooks/useUserRole'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { controlItem, controlSurface } from './helpers/control-style'

// Conta da pessoa (DESIGN.md 13): um círculo no canto de baixo à esquerda, fora do dock porque conta não é ferramenta do mapa.
// Abre Perfil e Sair; "Administração" só aparece para o superadmin. No celular sobe acima do dock, que ocupa a largura toda.
export function UserAvatarMenu() {
  const router = useRouter()
  const { isSuperadmin } = useUserRole()
  const [initial, setInitial] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      const name = (data.user?.user_metadata?.full_name as string | undefined) ?? data.user?.email ?? ''
      setInitial(name.trim().charAt(0).toUpperCase())
    })
  }, [])

  const signOut = async () => {
    await createClient().auth.signOut()
    router.refresh()
  }

  return (
    <>
      <div className="absolute bottom-4 left-4 z-[1000] max-[1120px]:bottom-24">
        <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Minha conta"
              className={cn('flex h-11 w-11 items-center justify-center rounded-full text-sm font-semibold hover:-translate-y-px', controlSurface, controlItem(menuOpen))}
            >
              {initial || <User className="h-4 w-4" aria-hidden />}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" sideOffset={8} className="z-[1100] w-52">
            <DropdownMenuItem
              className="cursor-pointer gap-2"
              onSelect={(e) => {
                e.preventDefault()
                setMenuOpen(false)
                setProfileOpen(true)
              }}
            >
              <User className="h-4 w-4" aria-hidden />
              Perfil
            </DropdownMenuItem>
            {isSuperadmin && (
              <DropdownMenuItem asChild className="cursor-pointer gap-2">
                <Link href="/admin">
                  <ShieldCheck className="h-4 w-4" aria-hidden />
                  Administração
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem className="cursor-pointer gap-2 text-crit focus:text-crit" onSelect={signOut}>
              <LogOut className="h-4 w-4" aria-hidden />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <UserProfileModal isOpen={profileOpen} onClose={() => setProfileOpen(false)} />
    </>
  )
}
