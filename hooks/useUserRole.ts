"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

export function useUserRole() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function checkUserRole() {
      try {
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          setIsAdmin(false)
          return
        }

        const res = await fetch("/api/auth/role")
        if (!res.ok) {
          setIsAdmin(false)
          return
        }
        const { isAdmin: adminResult } = await res.json()
        setIsAdmin(!!adminResult)
      } catch {
        setIsAdmin(false)
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

  return { isAdmin, isLoading }
}
