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
import { DetailItem } from "../ui/detail-Item"
import { formatDate } from "@/lib/helpers/formatter/formatDate"
import { formatTime } from "@/lib/helpers/formatter/formatTime"
import { formatDuration } from "@/lib/helpers/formatter/formatDuration"
import { AcaoDossie } from "./acaoDossie"

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

export function FeatureDetails({ layerType, properties }: { layerType: string; properties: Record<string, any> }) {
  
  const acaoId = layerType === "acoes" ? properties?.id : null;

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
        case "acoes":
          return (
            <AcaoDossie acaoId={properties.id} />
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

      {/* Content with scroll */}
      <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        <div className="grid grid-cols-1 gap-4 pr-2">{renderContent()}</div>
      </div>
    </div>
  )
}


