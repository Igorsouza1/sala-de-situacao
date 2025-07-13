"use client"

import { useEffect, useState } from "react"
import type React from "react"
import {
  Flame,
  Home,
  RouteIcon as Road,
  AlertTriangle,
  Footprints,
  MapPin,
  Info,
  Calendar,
  Clock,
  Ruler,
  Hash,
  MapIcon,
  Tag,
  FileText,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  X,
  ZoomIn,
} from "lucide-react"
import type { ReactNode } from "react"

// Helper to format date strings (e.g., "2024-05-20") into a local format (e.g., "20/05/2024")
const formatDate = (dateString: string | undefined) => {
  if (!dateString) return "Data não informada"
  try {
    const date = new Date(dateString)
    // Adjust for timezone offset to prevent date from shifting
    const userTimezoneOffset = date.getTimezoneOffset() * 60000
    return new Date(date.getTime() + userTimezoneOffset).toLocaleDateString("pt-BR")
  } catch (e) {
    return "Data inválida"
  }
}

// Helper to format 4-digit time strings (e.g., "1430") into HH:mm format
const formatTime = (timeString: string | undefined) => {
  if (!timeString || String(timeString).length < 3) return "Hora não informada"
  const paddedTime = String(timeString).padStart(4, "0")
  return `${paddedTime.slice(0, 2)}:${paddedTime.slice(2)}`
}

// Helper to convert duration in minutes to a human-readable format
const formatDuration = (minutes: number | undefined) => {
  if (minutes === undefined || minutes === null) return "Duração não informada"
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = Math.round(minutes % 60)
  let result = ""
  if (hours > 0) {
    result += `${hours} hora${hours > 1 ? "s" : ""}`
  }
  if (remainingMinutes > 0) {
    if (result) result += " e "
    result += `${remainingMinutes} minuto${remainingMinutes > 1 ? "s" : ""}`
  }
  return result || "Menos de um minuto"
}

// Style configuration for each layer type
const layerStyles: { [key: string]: { icon: React.ElementType; title: string; color: string; bgColor: string } } = {
  desmatamento: {
    icon: AlertTriangle,
    title: "Desmatamento",
    color: "text-yellow-600",
    bgColor: "bg-yellow-50 border-yellow-200",
  },
  firms: {
    icon: Flame,
    title: "Foco de Calor",
    color: "text-red-600",
    bgColor: "bg-red-50 border-red-200",
  },
  propriedades: {
    icon: Home,
    title: "Propriedade",
    color: "text-pantaneiro-green",
    bgColor: "bg-green-50 border-green-200",
  },
  estradas: {
    icon: Road,
    title: "Estrada",
    color: "text-gray-600",
    bgColor: "bg-gray-50 border-gray-200",
  },
  expedicoes: {
    icon: Footprints,
    title: "Expedição",
    color: "text-orange-600",
    bgColor: "bg-orange-50 border-orange-200",
  },
  waypoints: {
    icon: MapPin,
    title: "Waypoint",
    color: "text-orange-500",
    bgColor: "bg-orange-50 border-orange-200",
  },
  acoes: {
    icon: Tag,
    title: "Ação",
    color: "text-blue-600",
    bgColor: "bg-blue-50 border-blue-200",
  },
  default: {
    icon: Info,
    title: "Informações",
    color: "text-pantaneiro-green",
    bgColor: "bg-gray-50 border-gray-200",
  },
}

// Image Modal Component
const ImageModal = ({
  isOpen,
  onClose,
  images,
  currentIndex,
  onNavigate,
}: {
  isOpen: boolean
  onClose: () => void
  images: string[]
  currentIndex: number
  onNavigate: (index: number) => void
}) => {
  if (!isOpen) return null

  const nextImage = () => {
    onNavigate((currentIndex + 1) % images.length)
  }

  const prevImage = () => {
    onNavigate((currentIndex - 1 + images.length) % images.length)
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="relative max-w-4xl max-h-full w-full">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors z-10"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Image container */}
        <div className="relative bg-white rounded-lg overflow-hidden shadow-2xl">
          <img
            src={images[currentIndex] || "/placeholder.svg"}
            alt={`Imagem ${currentIndex + 1}`}
            className="w-full max-h-[80vh] object-contain"
          />

          {/* Navigation arrows for multiple images */}
          {images.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center hover:bg-white transition-colors"
              >
                <ChevronLeft className="w-6 h-6 text-gray-700" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center hover:bg-white transition-colors"
              >
                <ChevronRight className="w-6 h-6 text-gray-700" />
              </button>
            </>
          )}

          {/* Image counter */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm">
              {currentIndex + 1} de {images.length}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Compact image carousel component
const ImageCarousel = ({ images }: { images: string[] }) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)

  if (images.length === 0) return null

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length)
  }

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  const openModal = () => {
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
  }

  return (
    <>
      <div className="bg-white border border-gray-100 rounded-lg shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-3 border-b border-gray-100">
          <div className="flex items-center space-x-2">
            <ImageIcon className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Imagens registradas</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500">
              {currentIndex + 1} de {images.length}
            </span>
            <button
              onClick={openModal}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              title="Expandir imagem"
            >
              <ZoomIn className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="relative">
          <img
            src={images[currentIndex] || "/placeholder.svg"}
            alt={`Imagem ${currentIndex + 1}`}
            className="w-full h-60 object-cover cursor-pointer hover:opacity-95 transition-opacity"
            onClick={openModal}
          />

          {/* Navigation arrows - only show if more than 1 image */}
          {images.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full shadow-md flex items-center justify-center hover:bg-white transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-gray-700" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full shadow-md flex items-center justify-center hover:bg-white transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-gray-700" />
              </button>
            </>
          )}

          {/* Dots indicator - only show if more than 1 image */}
          {images.length > 1 && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-1">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    index === currentIndex ? "bg-white" : "bg-white/50"
                  }`}
                />
              ))}
            </div>
          )}

          {/* Click to expand hint */}
          <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm text-white px-2 py-1 rounded text-xs opacity-0 hover:opacity-100 transition-opacity">
            Clique para expandir
          </div>
        </div>
      </div>

      {/* Image Modal */}
      <ImageModal
        isOpen={isModalOpen}
        onClose={closeModal}
        images={images}
        currentIndex={currentIndex}
        onNavigate={setCurrentIndex}
      />
    </>
  )
}

// A reusable component for displaying a single piece of data
const DetailItem = ({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: ReactNode }) => (
  <div className="flex items-start space-x-3 p-4 bg-white border border-gray-100 rounded-lg shadow-sm">
    <div className="flex-shrink-0 w-10 h-10 bg-pantaneiro-lime/20 rounded-lg flex items-center justify-center">
      <Icon className="h-5 w-5 text-pantaneiro-green" />
    </div>
    <div className="flex flex-col min-w-0 flex-1">
      <span className="text-sm font-medium text-gray-600 mb-1">{label}</span>
      <span className="text-base font-semibold text-gray-900 break-words">{value || "Não informado"}</span>
    </div>
  </div>
)

export function FeatureDetails({ layerType, properties }: { layerType: string; properties: Record<string, any> }) {
  const [imagens, setImagens] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  // Differentiate between an expedition track and a waypoint
  const isWaypoint = layerType === "expedicoes" && properties.name
  const effectiveLayerType = isWaypoint ? "waypoints" : layerType

  const style = layerStyles[effectiveLayerType] || layerStyles.default
  const Icon = style.icon

  useEffect(() => {
    if (layerType === "acoes" && properties?.id) {
      setLoading(true)
      fetch(`/api/acoes/${properties.id}`)
        .then((res) => res.json())
        .then((data) => {
          const urls = Array.isArray(data.imagens) ? data.imagens.map((img: any) => img.url) : []
          setImagens(urls)
        })
        .catch(console.error)
        .finally(() => setLoading(false))
    } else {
      setImagens([])
    }
  }, [layerType, properties?.id])

  const renderContent = () => {
    switch (effectiveLayerType) {
      case "desmatamento":
        return (
          <>
            <DetailItem icon={Ruler} label="Tamanho da área (hectares)" value={properties.alertha?.toFixed(2)} />
            <DetailItem icon={Calendar} label="Data de detecção" value={formatDate(properties.detectat)} />
            <DetailItem icon={Calendar} label="Ano de detecção" value={properties.detectyear} />
            <DetailItem icon={MapIcon} label="Estado" value={properties.state} />
          </>
        )
      case "firms":
        return (
          <>
            <DetailItem icon={Calendar} label="Data de detecção" value={formatDate(properties.acq_date)} />
            <DetailItem icon={Clock} label="Hora da detecção" value={formatTime(properties.acq_time)} />
          </>
        )
      case "propriedades":
        return (
          <>
            <DetailItem icon={FileText} label="Nome da propriedade" value={properties.nome || "A ser adicionado"} />
            <DetailItem icon={Hash} label="Código do imóvel" value={properties.cod_imovel} />
            <DetailItem
              icon={Ruler}
              label="Tamanho da propriedade (hectares)"
              value={properties.num_area?.toFixed(2)}
            />
            <DetailItem icon={MapIcon} label="Município" value={properties.municipio} />
          </>
        )
      case "estradas":
        return (
          <>
            <DetailItem icon={FileText} label="Nome" value={properties.nome || "Estrada sem nome"} />
            <DetailItem icon={Tag} label="Tipo" value={properties.tipo || "Tipo não especificado"} />
            <DetailItem icon={Hash} label="Código" value={properties.codigo || "Código não disponível"} />
          </>
        )
      case "expedicoes":
        return (
          <>
            <DetailItem icon={Calendar} label="Data" value={formatDate(properties.data)} />
            <DetailItem icon={Clock} label="Duração" value={formatDuration(properties.duracao)} />
          </>
        )
      case "waypoints":
        return (
          <>
            <DetailItem icon={FileText} label="Nome do waypoint" value={properties.name} />
            <DetailItem icon={Calendar} label="Data" value={formatDate(properties.data)} />
          </>
        )
      case "acoes":
        return (
          <>
            {/* Image carousel - only shows if there are images */}
            {!loading && imagens.length > 0 && <ImageCarousel images={imagens} />}

            {/* Loading state for images */}
            {loading && (
              <div className="bg-white border border-gray-100 rounded-lg shadow-sm p-4">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm text-gray-600">Carregando imagens...</span>
                </div>
              </div>
            )}

            {/* Action details */}
            <DetailItem icon={FileText} label="Nome" value={properties.name} />
            <DetailItem icon={Tag} label="Ação" value={properties.acao} />
            <DetailItem icon={Calendar} label="Data" value={formatDate(properties.time)} />
            <DetailItem icon={FileText} label="Descrição" value={properties.descricao} />
          </>
        )
      default:
        return (
          <div className="col-span-full text-center py-8">
            <Info className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">Nenhuma informação detalhada disponível para esta camada.</p>
          </div>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`flex items-center space-x-4 p-4 rounded-lg border-2 ${style.bgColor}`}>
        <div className="flex-shrink-0 w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm">
          <Icon className={`h-7 w-7 ${style.color}`} />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">{style.title}</h3>
          <p className="text-sm text-gray-600">Detalhes da camada selecionada</p>
        </div>
      </div>

      {/* Content with scroll */}
      <div className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        <div className="grid grid-cols-1 gap-4 pr-2">{renderContent()}</div>
      </div>
    </div>
  )
}

// Default export for preview purposes
export default function Component() {
  // Example usage for "acoes" with placeholder data
  const exampleProperties = {
    id: "123",
    name: "Ação de Monitoramento",
    acao: "Fiscalização",
    time: "2024-07-08T10:30:00Z",
    descricao: "Monitoramento de área de desmatamento ilegal.",
  }

  // Example usage for "desmatamento"
  const desmatamentoProperties = {
    alertha: 15.25,
    detectat: "2023-11-15",
    detectyear: 2023,
    state: "MT",
  }

  return (
    <div className="p-4 max-w-md mx-auto space-y-8">
      <FeatureDetails layerType="acoes" properties={exampleProperties} />
      <FeatureDetails layerType="desmatamento" properties={desmatamentoProperties} />
    </div>
  )
}
