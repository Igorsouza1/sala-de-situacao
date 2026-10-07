"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

export function useUserRole() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [canEdit, setCanEdit] = useState(false)
  const [isSuperadmin, setIsSuperadmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    function clear() {
      setIsAdmin(false)
      setCanEdit(false)
      setIsSuperadmin(false)
    }

    async function checkUserRole() {
      try {
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          clear()
          return
        }

        const res = await fetch("/api/auth/role")
        if (!res.ok) {
          clear()
          return
        }
        const role = await res.json()
        setIsAdmin(!!role.isAdmin)
        setCanEdit(!!role.canEdit)
        setIsSuperadmin(!!role.isSuperadmin)
      } catch {
        clear()
      } finally {
        setIsLoading(false)
      }
    }

    checkUserRole()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkUserRole()
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  return { isAdmin, canEdit, isSuperadmin, isLoading }
}
