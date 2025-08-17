"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"

export function useUserRole() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function checkUserRole() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user) {
          const { data } = await supabase.schema("public").from("profiles").select("role").eq("id", user.id).single()

          if (data) {
            setIsAdmin(data.role === "Admin")
          } else {
            setIsAdmin(false)
          }
        } 
      } catch (error) {
        setIsAdmin(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkUserRole()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      checkUserRole()
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  return { isAdmin, isLoading }
}

