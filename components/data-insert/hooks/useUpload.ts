"use client"

import { useState } from "react"
import { useToast } from "@/hooks/use-toast"

export function useUpload() {
  const [isUploading, setIsUploading] = useState(false)
  const { toast } = useToast()

  const uploadPhoto = async (file: File): Promise<string> => {
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("photo", file)

      const response = await fetch("/api/uploads/photo", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Erro no upload da foto")
      }

      const data = await response.json()
      return data.url
    } catch (error: any) {
      toast({
        title: "Erro no upload",
        description: error.message,
        variant: "destructive",
      })
      throw error
    } finally {
      setIsUploading(false)
    }
  }

  return {
    uploadPhoto,
    isUploading,
  }
}
