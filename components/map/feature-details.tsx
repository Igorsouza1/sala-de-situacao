"use client"

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
  default: {
    icon: Info,
    title: "Informações",
    color: "text-pantaneiro-green",
    bgColor: "bg-gray-50 border-gray-200",
  },
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
  // Differentiate between an expedition track and a waypoint
  const isWaypoint = layerType === "expedicoes" && properties.name
  const effectiveLayerType = isWaypoint ? "waypoints" : layerType

  const style = layerStyles[effectiveLayerType] || layerStyles.default
  const Icon = style.icon

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

      {/* Content */}
      <div className="grid grid-cols-1 gap-4">{renderContent()}</div>
    </div>
  )
}
