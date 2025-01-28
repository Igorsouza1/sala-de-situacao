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
          error: userError,
        } = await supabase.auth.getUser()


        if (userError) {
          console.error("Error getting user:", userError)
          setIsAdmin(false)
          setIsLoading(false)
          return
        }

        if (user) {
          // Fixed query syntax for Supabase
          const { data, error } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id) // Changed from user_ref to id since that's now the column name
            .maybeSingle()


          if (error) {
            console.error("Error fetching user role:", error)
            setIsAdmin(false)
          } else if (data) {
            // Check if the role is exactly 'Admin' (case-sensitive)
            const isUserAdmin = data.role === "Admin"
            setIsAdmin(isUserAdmin)
          } else {
            setIsAdmin(false)
          }
        } else {
          setIsAdmin(false)
        }
      } catch (error) {
        console.error("Unexpected error in checkUserRole:", error)
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

