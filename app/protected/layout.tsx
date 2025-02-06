import { Navbar } from "@/components/Navbar"
import "@/app/globals.css"
import { Inter } from "next/font/google"
import { MapProvider } from "@/context/GeoDataContext"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Instituto Homem Pantaneiro",
  description: "Plataforma de gestão do Instituto Homem Pantaneiro",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
        <div className="flex min-h-screen bg-gray-50">
          <Navbar />
          <MapProvider> 
          <main className="flex-1">{children}</main>
          </MapProvider>
        </div>
  )
}

