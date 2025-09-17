"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Database, Users, CodeIcon } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/protected/admin/data", icon: Database, label: "Gerenciar Dados" },
  { href: "/protected/admin/users", icon: Users, label: "Gerenciar Usuários" },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-60 flex-shrink-0 bg-primary-forest border-l border-white/10 flex flex-col">
      <div className="h-16 flex items-center justify-center px-4 border-b border-white/10">
        <Link href="/" className="flex items-center space-x-2">
          <CodeIcon className="h-7 w-7 text-white" />
          <h1 className="text-xl font-bold text-white">Admin</h1>
        </Link>
      </div>
      <nav className="flex-grow p-3 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center px-3 py-2.5 text-sm text-gray-200 rounded-md hover:bg-white/10 hover:text-white transition-colors duration-200 font-medium",
              (pathname.startsWith(item.href) && item.href !== "/") || pathname === item.href
                ? "bg-white/10 text-white"
                : "",
            )}
          >
            <item.icon className="h-5 w-5 mr-3 flex-shrink-0" />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  )
}
