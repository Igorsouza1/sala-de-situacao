"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

interface Papel {
  isAdmin: boolean
  canEdit: boolean
  isSuperadmin: boolean
}

const SEM_PAPEL: Papel = { isAdmin: false, canEdit: false, isSuperadmin: false }

// Cinco componentes do mapa pedem o papel ao mesmo tempo. Uma única consulta em andamento serve a todos (e o login/logout invalida):
// antes, cada um chamava `/api/auth/role` por conta própria e de novo a cada evento de sessão (inclusive a renovação do token).
let emAndamento: Promise<Papel> | null = null
let ultimo: Papel | null = null

async function buscarPapel(supabase: ReturnType<typeof createClient>): Promise<Papel> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return SEM_PAPEL
    const res = await fetch("/api/auth/role")
    if (!res.ok) return SEM_PAPEL
    const role = await res.json()
    return { isAdmin: !!role.isAdmin, canEdit: !!role.canEdit, isSuperadmin: !!role.isSuperadmin }
  } catch {
    return SEM_PAPEL
  }
}

function papel(supabase: ReturnType<typeof createClient>, forcar = false): Promise<Papel> {
  if (!forcar && ultimo) return Promise.resolve(ultimo)
  if (!emAndamento) {
    emAndamento = buscarPapel(supabase).then((p) => {
      ultimo = p
      emAndamento = null
      return p
    })
  }
  return emAndamento
}

export function useUserRole() {
  const [role, setRole] = useState<Papel>(ultimo ?? SEM_PAPEL)
  const [isLoading, setIsLoading] = useState(!ultimo)
  const supabase = createClient()

  useEffect(() => {
    let vivo = true
    const carregar = (forcar = false) =>
      papel(supabase, forcar).then((p) => {
        if (!vivo) return
        setRole(p)
        setIsLoading(false)
      })

    carregar()

    // só quem entra ou sai troca o papel; a leitura inicial e a renovação do token não mudam nada
    const { data: { subscription } } = supabase.auth.onAuthStateChange((evento) => {
      if (evento === "SIGNED_IN" || evento === "SIGNED_OUT" || evento === "USER_UPDATED") carregar(true)
    })

    return () => {
      vivo = false
      subscription.unsubscribe()
    }
  }, [supabase])

  return { ...role, isLoading }
}
