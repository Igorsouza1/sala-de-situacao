'use client'

import React, { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { MapPin, Target, WifiOff, RefreshCw, CheckCircle } from 'lucide-react'

const JavaliMapPicker = dynamic(() => import('@/components/JavaliMapPicker'), {
  ssr: false,
  loading: () => (
    <div className="h-[300px] w-full bg-gray-100 animate-pulse rounded-md flex items-center justify-center">
      Carregando mapa...
    </div>
  ),
})

// ─── Fila offline (localStorage) ─────────────────────────────────────────────
const QUEUE_KEY = 'javali_pending_sightings'

interface PendingSighting {
  id: string
  tipo: string
  observacoes?: string
  latitude: number
  longitude: number
  timestamp: number
}

function loadQueue(): PendingSighting[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]')
  } catch {
    return []
  }
}

function saveQueue(queue: PendingSighting[]) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return generateId()
  }
  // Fallback para contextos sem crypto.randomUUID (HTTP local)
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

async function flushQueue(): Promise<number> {
  const queue = loadQueue()
  if (queue.length === 0) return 0

  const remaining: PendingSighting[] = []
  let synced = 0

  for (const item of queue) {
    try {
      const res = await fetch('/api/javali-avistamentos/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      })
      if (res.ok) {
        synced++
      } else {
        remaining.push(item)
      }
    } catch {
      remaining.push(item)
    }
  }

  saveQueue(remaining)
  return synced
}

// ─── Tipos de submissão ───────────────────────────────────────────────────────
type SuccessState = 'sent' | 'queued'

// ─── Componente principal ─────────────────────────────────────────────────────
export default function AvistamentoJavali() {
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null)
  const [tipo, setTipo] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successState, setSuccessState] = useState<SuccessState | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isOnline, setIsOnline] = useState(true)
  const [pendingCount, setPendingCount] = useState(0)
  const [syncMessage, setSyncMessage] = useState<string | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)

  const updatePendingCount = useCallback(() => {
    setPendingCount(loadQueue().length)
  }, [])

  const handleFlushQueue = useCallback(async () => {
    if (isSyncing) return
    setIsSyncing(true)
    try {
      const synced = await flushQueue()
      updatePendingCount()
      if (synced > 0) {
        setSyncMessage(`${synced} registro${synced > 1 ? 's' : ''} sincronizado${synced > 1 ? 's' : ''}!`)
        setTimeout(() => setSyncMessage(null), 4000)
      }
    } finally {
      setIsSyncing(false)
    }
  }, [isSyncing, updatePendingCount])

  useEffect(() => {
    setIsOnline(navigator.onLine)
    updatePendingCount()

    const handleOnline = () => {
      setIsOnline(true)
      handleFlushQueue()
    }
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Registra o service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((reg) => {
          // Pede Background Sync ao SW (Chrome/Edge)
          if ('sync' in reg) {
            reg.sync.register('javali-sync').catch(() => {})
          }
          // Escuta mensagens do SW para sincronizar
          navigator.serviceWorker.addEventListener('message', (event) => {
            if (event.data?.type === 'SYNC_REQUESTED') {
              handleFlushQueue()
            }
          })
        })
        .catch((err) => console.warn('SW não registrado:', err))
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [handleFlushQueue, updatePendingCount])

  const handleGetLocation = () => {
    if (!('geolocation' in navigator)) {
      alert('Geolocalização não é suportada neste navegador.')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoordinates({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        })
      },
      () => {
        alert('Não foi possível obter sua localização. Permita o acesso ou marque no mapa.')
      }
    )
  }

  const handleMapClick = (lat: number, lng: number) => {
    setCoordinates({ lat, lng })
  }

  const resetForm = (form: HTMLFormElement) => {
    setCoordinates(null)
    setTipo('')
    form.reset()
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!coordinates) {
      setError('Por favor, selecione as coordenadas (clique no mapa ou use sua localização atual).')
      return
    }
    if (!tipo) {
      setError('Por favor, selecione o tipo de avistamento.')
      return
    }

    const form = e.currentTarget
    const observacoes = (form.elements.namedItem('observacoes') as HTMLTextAreaElement)?.value

    setIsSubmitting(true)
    setError(null)

    const payload = {
      tipo,
      observacoes,
      latitude: coordinates.lat,
      longitude: coordinates.lng,
    }

    // Offline: enfileira localmente
    if (!navigator.onLine) {
      const queue = loadQueue()
      queue.push({ ...payload, id: generateId(), timestamp: Date.now() })
      saveQueue(queue)
      updatePendingCount()
      setIsSubmitting(false)
      setSuccessState('queued')
      resetForm(form)
      return
    }

    // Online: tenta enviar direto
    try {
      const res = await fetch('/api/javali-avistamentos/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const result = await res.json()

      if (result.success) {
        setSuccessState('sent')
        resetForm(form)
      } else {
        setError(result.error || 'Erro desconhecido ao salvar o registro.')
      }
    } catch {
      // Falha de rede: enfileira
      const queue = loadQueue()
      queue.push({ ...payload, id: generateId(), timestamp: Date.now() })
      saveQueue(queue)
      updatePendingCount()
      setSuccessState('queued')
      resetForm(form)
    } finally {
      setIsSubmitting(false)
    }
  }

  // ─── Tela de sucesso ───────────────────────────────────────────────────────
  if (successState) {
    const wasQueued = successState === 'queued'
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-sm text-center">
          <div
            className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full mb-4 ${
              wasQueued ? 'bg-yellow-100' : 'bg-green-100'
            }`}
          >
            {wasQueued ? (
              <WifiOff className="h-6 w-6 text-yellow-600" />
            ) : (
              <MapPin className="h-6 w-6 text-green-600" />
            )}
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {wasQueued ? 'Registro Salvo!' : 'Registro Enviado!'}
          </h2>
          <p className="text-gray-600 mb-6">
            {wasQueued
              ? 'Sem conexão no momento. Seu registro foi salvo e será enviado automaticamente quando a internet voltar.'
              : 'Agradecemos pela sua colaboração. Suas informações são muito importantes para o monitoramento.'}
          </p>
          {pendingCount > 0 && (
            <p className="text-sm text-yellow-700 bg-yellow-50 rounded-md p-2 mb-4">
              {pendingCount} registro{pendingCount > 1 ? 's' : ''} pendente{pendingCount > 1 ? 's' : ''} na fila
            </p>
          )}
          <Button onClick={() => setSuccessState(null)} className="w-full">
            Fazer Novo Registro
          </Button>
        </div>
      </div>
    )
  }

  // ─── Formulário principal ──────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 flex py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 mx-auto bg-white p-6 rounded-lg shadow-sm">

        {/* Banner offline */}
        {!isOnline && (
          <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm rounded-md px-3 py-2">
            <WifiOff className="h-4 w-4 shrink-0" />
            <span>Você está offline. O registro será salvo e enviado quando a internet voltar.</span>
          </div>
        )}

        {/* Banner de sincronização pendente */}
        {isOnline && pendingCount > 0 && (
          <div className="flex items-center justify-between gap-2 bg-blue-50 border border-blue-200 text-blue-800 text-sm rounded-md px-3 py-2">
            <span>
              {pendingCount} registro{pendingCount > 1 ? 's' : ''} pendente{pendingCount > 1 ? 's' : ''} na fila
            </span>
            <button
              onClick={handleFlushQueue}
              disabled={isSyncing}
              className="flex items-center gap-1 text-blue-700 font-medium hover:underline disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Sincronizando...' : 'Sincronizar'}
            </button>
          </div>
        )}

        {/* Banner de sucesso de sync */}
        {syncMessage && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-800 text-sm rounded-md px-3 py-2">
            <CheckCircle className="h-4 w-4 shrink-0" />
            <span>{syncMessage}</span>
          </div>
        )}

        <div>
          <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900">
            Registro de Javali
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Avistou um javali ou rastros? Informe no formulário abaixo.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {/* Honeypot anti-spam */}
          <div style={{ display: 'none' }} aria-hidden="true">
            <label htmlFor="bot_field">Don&apos;t fill this out if you&apos;re human:</label>
            <input type="text" id="bot_field" name="bot_field" tabIndex={-1} autoComplete="off" />
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tipo">O que você viu?</Label>
              <Select value={tipo} onValueChange={setTipo} required>
                <SelectTrigger id="tipo" className="w-full">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Animal visualizado">Animal visualizado</SelectItem>
                  <SelectItem value="Rastro/Pegadas">Rastro/Pegadas</SelectItem>
                  <SelectItem value="Fezes/Vestígios">Fezes/Vestígios</SelectItem>
                  <SelectItem value="Outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações adicionais (opcional)</Label>
              <Textarea
                id="observacoes"
                name="observacoes"
                placeholder="Detalhes sobre quantidade, direção, comportamento, etc."
                className="resize-none"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Localização</Label>
              <p className="text-sm text-gray-500 mb-2">
                Clique no botão abaixo para usar seu GPS ou clique diretamente no mapa para marcar o ponto.
              </p>

              <Button
                type="button"
                variant="outline"
                className="w-full mb-4 flex items-center justify-center gap-2"
                onClick={handleGetLocation}
              >
                <Target className="h-4 w-4" />
                Usar minha localização atual
              </Button>

              <div className="border rounded-md overflow-hidden relative" style={{ height: '300px' }}>
                <JavaliMapPicker
                  initialCoords={coordinates}
                  onLocationSelected={handleMapClick}
                />
              </div>

              {coordinates && (
                <p className="text-xs text-green-600 font-medium">
                  Coordenadas selecionadas: {coordinates.lat.toFixed(5)}, {coordinates.lng.toFixed(5)}
                </p>
              )}
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm font-medium p-3 bg-red-50 rounded-md">
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || !coordinates || !tipo}
          >
            {isSubmitting ? 'Salvando...' : isOnline ? 'Enviar Registro' : 'Salvar Offline'}
          </Button>
        </form>
      </div>
    </div>
  )
}
