import type React from "react"
import { Sidebar } from "@/components/admin/layout/sidebar"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen max-h-screen bg-gray-100 dark:bg-background">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-x-hidden overflow-y-auto bg-wave-gradient bg-cover bg-center">{children}</div>
      </main>
    </div>
  )
}
