'use client'

import { useEffect, useState } from 'react'
import { X, Download, Share, Plus } from 'lucide-react'

const DISMISSED_KEY = 'javali_install_dismissed'

type Platform = 'android' | 'ios' | 'other'

function detectPlatform(): Platform {
  if (typeof navigator === 'undefined') return 'other'
  const ua = navigator.userAgent
  if (/iphone|ipad|ipod/i.test(ua)) return 'ios'
  if (/android/i.test(ua)) return 'android'
  return 'other'
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // @ts-expect-error — iOS Safari
    !!navigator.standalone
  )
}

export default function InstallPrompt() {
  const [platform, setPlatform]       = useState<Platform>('other')
  const [showPrompt, setShowPrompt]   = useState(false)
  const [deferredEvt, setDeferredEvt] = useState<Event | null>(null)
  const [showIosGuide, setShowIosGuide] = useState(false)

  useEffect(() => {
    if (isStandalone()) return                                 // já instalado
    if (localStorage.getItem(DISMISSED_KEY)) return           // já dispensado

    const plt = detectPlatform()
    setPlatform(plt)

    if (plt === 'android') {
      // Android: aguarda o evento nativo do browser
      const handler = (e: Event) => {
        e.preventDefault()
        setDeferredEvt(e)
        setShowPrompt(true)
      }
      window.addEventListener('beforeinstallprompt', handler)
      return () => window.removeEventListener('beforeinstallprompt', handler)
    }

    if (plt === 'ios') {
      // iOS: não há evento nativo — mostramos guia manual
      setShowPrompt(true)
    }
  }, [])

  const dismiss = () => {
    setShowPrompt(false)
    setShowIosGuide(false)
    localStorage.setItem(DISMISSED_KEY, '1')
  }

  const handleAndroidInstall = async () => {
    if (!deferredEvt) return
    // @ts-expect-error — prompt() existe no evento
    deferredEvt.prompt()
    // @ts-expect-error
    const { outcome } = await deferredEvt.userChoice
    if (outcome === 'accepted') {
      setShowPrompt(false)
    }
  }

  if (!showPrompt) return null

  // ── iOS: banner simples → abre guia passo a passo ─────────────────────────
  if (platform === 'ios') {
    return (
      <>
        {/* Banner inferior */}
        {!showIosGuide && (
          <div className="fixed bottom-0 inset-x-0 z-50 p-4 bg-white border-t border-gray-200 shadow-lg flex items-center gap-3">
            <div className="flex-1">
              <p className="font-semibold text-sm text-gray-900">Instalar como app</p>
              <p className="text-xs text-gray-500">Funciona offline, abre igual app nativo</p>
            </div>
            <button
              onClick={() => setShowIosGuide(true)}
              className="bg-green-600 text-white text-sm font-medium px-4 py-2 rounded-lg shrink-0"
            >
              Como instalar
            </button>
            <button onClick={dismiss} className="text-gray-400 p-1">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Guia passo a passo iOS */}
        {showIosGuide && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-end">
            <div className="bg-white w-full rounded-t-2xl p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-900 text-lg">Instalar no iPhone</h3>
                <button onClick={dismiss} className="text-gray-400">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <Step n={1} icon={<Share className="h-5 w-5 text-blue-500" />}>
                  Toque no ícone de <strong>Compartilhar</strong> na barra inferior do Safari
                </Step>
                <Step n={2} icon={<Plus className="h-5 w-5 text-green-600" />}>
                  Role para baixo e toque em{' '}
                  <strong>&ldquo;Adicionar à Tela de Início&rdquo;</strong>
                </Step>
                <Step n={3} icon={<Download className="h-5 w-5 text-gray-700" />}>
                  Toque em <strong>Adicionar</strong> — o app aparecerá na sua tela inicial
                </Step>
              </div>

              <p className="text-xs text-gray-500 text-center">
                Após instalar, o app abre sem precisar de internet.
              </p>

              <button
                onClick={dismiss}
                className="w-full bg-gray-100 text-gray-700 font-medium py-3 rounded-xl text-sm"
              >
                Entendi
              </button>
            </div>
          </div>
        )}
      </>
    )
  }

  // ── Android: banner com botão de instalação nativa ─────────────────────────
  return (
    <div className="fixed bottom-0 inset-x-0 z-50 p-4 bg-white border-t border-gray-200 shadow-lg flex items-center gap-3">
      <div className="flex-1">
        <p className="font-semibold text-sm text-gray-900">Instalar como app</p>
        <p className="text-xs text-gray-500">Funciona offline, abre igual app nativo</p>
      </div>
      <button
        onClick={handleAndroidInstall}
        className="bg-green-600 text-white text-sm font-medium px-4 py-2 rounded-lg shrink-0 flex items-center gap-1.5"
      >
        <Download className="h-4 w-4" />
        Instalar
      </button>
      <button onClick={dismiss} className="text-gray-400 p-1">
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

function Step({ n, icon, children }: { n: number; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 text-gray-700 font-bold text-sm shrink-0">
        {n}
      </div>
      <div className="flex items-center gap-2 pt-0.5">
        {icon}
        <span className="text-sm text-gray-700">{children}</span>
      </div>
    </div>
  )
}
