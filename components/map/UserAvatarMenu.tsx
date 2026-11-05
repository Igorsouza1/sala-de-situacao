'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Check, Loader2, LogOut, MapPinned, ShieldCheck, User } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { UserProfileModal } from '@/components/user-profile-modal'
import { useUserRole } from '@/hooks/useUserRole'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { controlItem, controlSurface } from './helpers/control-style'
import { openRegionCookie } from '@/lib/open-region-cookie'
import { currentRegionLabel, mixesOrganizations, regionCaption, regionHref, type RegionOption } from './helpers/regions'

// Conta da pessoa (DESIGN.md 13.11): um círculo no canto de baixo à esquerda, fora do dock porque conta não é ferramenta do mapa.
// Abre Perfil, Regiões (só para quem tem mais de uma), Administração (só o superadmin) e Sair. No celular sobe acima do dock.
// "Regiões" diz onde a pessoa está e abre a lista das Regiões para onde ela pode ir (as mesmas regras do escopo das rotas): escolher uma
// troca o endereço, o mapa voa até ela e um aviso diz onde ela chegou. Enquanto troca, o avatar mostra que está trabalhando.

interface UserAvatarMenuProps {
  /** a troca de Região terminou: o mapa avisa onde a pessoa chegou */
  onRegionChanged?: (region: RegionOption) => void
}

export function UserAvatarMenu({ onRegionChanged }: UserAvatarMenuProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { isSuperadmin } = useUserRole()
  const [initial, setInitial] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [regions, setRegions] = useState<RegionOption[]>([])
  const [switching, startSwitch] = useTransition()
  const target = useRef<RegionOption | null>(null)

  const currentId = Number(searchParams.get('regiao_id')) || null

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      const name = (data.user?.user_metadata?.full_name as string | undefined) ?? data.user?.email ?? ''
      setInitial(name.trim().charAt(0).toUpperCase())
    })
    // a lista é pequena e só serve ao menu: se não vier, o item simplesmente não aparece (o resto da conta segue)
    fetch('/api/map/regioes')
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { regioes?: RegionOption[] } | null) => setRegions(data?.regioes ?? []))
      .catch(() => {})
  }, [])

  // a navegação terminou: avisa uma vez onde a pessoa chegou
  useEffect(() => {
    if (switching || !target.current) return
    onRegionChanged?.(target.current)
    target.current = null
  }, [switching, onRegionChanged])

  const goTo = (region: RegionOption) => {
    setMenuOpen(false)
    if (region.id === currentId) return
    target.current = region
    // a Região pode ser de outra Organização da pessoa: o cookie faz as rotas falarem dela já na primeira chamada
    document.cookie = openRegionCookie(region.id, window.location.protocol === 'https:')
    startSwitch(() => router.push(regionHref(pathname, searchParams.toString(), region.id)))
  }

  const signOut = async () => {
    await createClient().auth.signOut()
    router.refresh()
  }

  const withOrg = mixesOrganizations(regions)

  return (
    <>
      <div className="absolute bottom-4 left-4 z-[1000] max-[1120px]:bottom-24">
        <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={switching ? 'Minha conta (trocando de região…)' : 'Minha conta'}
              aria-busy={switching}
              className={cn('flex h-11 w-11 items-center justify-center rounded-full text-sm font-semibold hover:-translate-y-px', controlSurface, controlItem(menuOpen))}
            >
              {switching ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : initial || <User className="h-4 w-4" aria-hidden />}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" sideOffset={8} className="z-[1100] w-60">
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

            {regions.length > 1 && (
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="cursor-pointer gap-2">
                  <MapPinned className="h-4 w-4 shrink-0" aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block">Regiões</span>
                    <span className="block truncate text-xs text-muted-foreground">{currentRegionLabel(regions, currentId)}</span>
                  </span>
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent sideOffset={6} className="z-[1200] w-72 p-1">
                    <p className="px-2 pb-1 pt-1.5 text-xs text-muted-foreground">Escolha para onde o mapa vai.</p>
                    {regions.map((r) => {
                      const current = r.id === currentId
                      const caption = regionCaption(r, withOrg)
                      return (
                        <DropdownMenuItem
                          key={r.id}
                          onSelect={() => goTo(r)}
                          aria-current={current ? 'location' : undefined}
                          className={cn('min-h-12 cursor-pointer items-center gap-2.5 py-2', current && 'bg-secondary text-secondary-foreground focus:bg-secondary')}
                        >
                          {/* a marca da atual tem coluna própria em todas as linhas (regra 3): os nomes ficam alinhados */}
                          <span className="flex w-4 shrink-0 justify-center" aria-hidden>
                            {current && <Check className="h-4 w-4" />}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block leading-snug">{r.nome}</span>
                            {(caption || current) && (
                              <span className={cn('mt-0.5 block text-xs leading-snug', current ? 'text-secondary-foreground' : 'text-muted-foreground')}>
                                {[current ? 'Você está aqui' : null, caption].filter(Boolean).join(' · ')}
                              </span>
                            )}
                          </span>
                        </DropdownMenuItem>
                      )
                    })}
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
            )}

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
