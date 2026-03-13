'use client'

import React, { useState } from 'react'
import { reportSighting } from './actions'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { MapPin, Target } from 'lucide-react'

// Dynamically import the map picker
const JavaliMapPicker = dynamic(() => import('@/components/JavaliMapPicker'), {
  ssr: false,
  loading: () => <div className="h-[300px] w-full bg-gray-100 animate-pulse rounded-md flex items-center justify-center">Carregando mapa...</div>
})

export default function AvistamentoJavali() {
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null)
  const [tipo, setTipo] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGetLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoordinates({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
        },
        (err) => {
          console.error("Error getting location:", err)
          alert("Não foi possível obter sua localização. Por favor, permita o acesso ou marque no mapa.")
        }
      )
    } else {
      alert("Geolocalização não é suportada neste navegador.")
    }
  }

  const handleMapClick = (lat: number, lng: number) => {
    setCoordinates({ lat, lng })
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!coordinates) {
      setError("Por favor, selecione as coordenadas (clique no mapa ou use sua localização atual).")
      return
    }

    if (!tipo) {
      setError("Por favor, selecione o tipo de avistamento.")
      return
    }

    setIsSubmitting(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    formData.append('latitude', coordinates.lat.toString())
    formData.append('longitude', coordinates.lng.toString())
    // For type select, append it manually as shadcn Select might not be in the natural form data
    formData.set('tipo', tipo)

    try {
      const result = await reportSighting(formData)
      if (result.success) {
        setIsSuccess(true)
        setCoordinates(null)
        setTipo('')
        e.currentTarget.reset()
      } else {
        setError(result.error || "Erro desconhecido ao salvar o registro.")
      }
    } catch (err) {
      setError("Ocorreu um erro de rede. Tente novamente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-sm text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <MapPin className="h-6 w-6 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Registro Enviado!</h2>
          <p className="text-gray-600 mb-6">Agradecemos pela sua colaboração. Suas informações são muito importantes para o monitoramento.</p>
          <Button onClick={() => setIsSuccess(false)} className="w-full">
            Fazer Novo Registro
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 mx-auto bg-white p-6 rounded-lg shadow-sm">
        <div>
          <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900">
            Registro de Javali
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Avistou um javali ou rastros? Informe no formulário abaixo.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {/* Honeypot field for anti-spam. Hidden via CSS. */}
          <div style={{ display: 'none' }} aria-hidden="true">
            <label htmlFor="bot_field">Don't fill this out if you're human:</label>
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
            {isSubmitting ? 'Enviando...' : 'Enviar Registro'}
          </Button>
        </form>
      </div>
    </div>
  )
}
