"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RouteIcon as Road, BracketsIcon as Bridge, Layers, MapPin } from "lucide-react"

type DataType = "estrada" | "ponteCure" | "dequePedras" | "acoes"

interface TypeSelectorProps {
  selectedType: DataType | null
  onTypeSelect: (type: DataType) => void
}

const dataTypes = [
  {
    id: "estrada" as DataType,
    title: "Estrada",
    description: "Cadastro de estradas com arquivo GPX (track/route) e preview no mapa",
    icon: Road,
    color: "bg-blue-500",
    requirements: ["Nome", "Tipo (opcional)", "Código (opcional)", "Arquivo GPX"],
  },
  {
    id: "ponteCure" as DataType,
    title: "Ponte do Cure",
    description: "Monitoramento de ponte com dados de chuva, nível e visibilidade",
    icon: Bridge,
    color: "bg-green-500",
    requirements: ["Local", "Data", "Chuva (opcional)", "Nível (opcional)", "Visibilidade (opcional)"],
  },
  {
    id: "dequePedras" as DataType,
    title: "Deque de Pedras",
    description: "Dados de qualidade da água com turbidez e medições secchi",
    icon: Layers,
    color: "bg-cyan-500",
    requirements: ["Local", "Data", "Turbidez (opcional)", "Secchi V/H (opcional)", "Chuva (opcional)"],
  },
  {
    id: "acoes" as DataType,
    title: "Ações",
    description: "Upload de GPX com waypoints, edição individual e anexo de fotos",
    icon: MapPin,
    color: "bg-orange-500",
    requirements: ["Arquivo GPX", "Classificação de waypoints", "Fotos (opcional)"],
  },
]

export function TypeSelector({ selectedType, onTypeSelect }: TypeSelectorProps) {
  return (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Selecione o Tipo de Dado</h3>
        <p className="text-muted-foreground">Escolha o tipo de informação que deseja inserir no sistema</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {dataTypes.map((type) => {
          const Icon = type.icon
          const isSelected = selectedType === type.id

          return (
            <Card
              key={type.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                isSelected ? "ring-2 ring-primary border-primary" : ""
              }`}
              onClick={() => onTypeSelect(type.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${type.color} text-white`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base">{type.title}</CardTitle>
                    {isSelected && (
                      <Badge variant="secondary" className="mt-1">
                        Selecionado
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground mb-3">{type.description}</p>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-600">Campos necessários:</p>
                  <ul className="text-xs text-gray-500 space-y-0.5">
                    {type.requirements.map((req, index) => (
                      <li key={index}>• {req}</li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
