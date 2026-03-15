import type { Metadata, Viewport } from 'next'
import InstallPrompt from '@/components/InstallPrompt'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,       // evita zoom acidental (sensação nativa)
  userScalable: false,
  viewportFit: 'cover',  // ocupa área de notch no iPhone
  themeColor: '#16a34a',
}

export const metadata: Metadata = {
  title: 'Registro de Javali - PRISMA',
  description: 'Reporte avistamentos de javali-europeu mesmo sem internet.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent', // barra translúcida no iOS
    title: 'Javali PRISMA',
    startupImage: '/logo.png',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
}

export default function AvistamentoJavaliLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {children}
      <InstallPrompt />
    </>
  )
}
