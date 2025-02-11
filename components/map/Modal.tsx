import type React from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Grid } from "@/components/ui/grid"

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[2000] flex justify-center items-center">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-md">
        <div className="flex justify-between items-center p-6 bg-gray-100 dark:bg-gray-700 rounded-t-lg">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-6 w-6" />
          </Button>
        </div>
        <Separator />
        <ScrollArea className="p-6 max-h-[70vh]">
          <Grid className="gap-4 text-gray-700 dark:text-gray-300">{children}</Grid>
        </ScrollArea>
      </div>
    </div>
  )
}

