"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TablePreview } from "../preview/TablePreview"
import { useToast } from "@/hooks/use-toast"
import { deriveMes } from "../utils/date"

type PonteCureFormValues = {
  local: string
  data: string
  chuva?: number | null
  nivel?: number | null
  visibilidade?: string | null
}

interface PonteCureFormProps {
  onValidate: (isValid: boolean) => void
  onPreview: (data: any) => void
}

export function PonteCureForm({ onValidate, onPreview }: PonteCureFormProps) {
  const [formData, setFormData] = useState<PonteCureFormValues>({
    local: "",
    data: new Date().toISOString().split("T")[0],
    chuva: null,
    nivel: null,
    visibilidade: "",
  })
  const [previewData, setPreviewData] = useState<any>(null)
  const { toast } = useToast()

  const handleInputChange = (field: keyof PonteCureFormValues, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    onValidate(false) // Reset validation when form changes
  }

  const handleValidate = () => {
    if (!formData.local.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "O local é obrigatório.",
        variant: "destructive",
      })
      return
    }

    if (!formData.data) {
      toast({
        title: "Campo obrigatório",
        description: "A data é obrigatória.",
        variant: "destructive",
      })
      return
    }

    const processedData = {
      ...formData,
      mes: deriveMes(formData.data),
      chuva: formData.chuva || null,
      nivel: formData.nivel || null,
      visibilidade: formData.visibilidade || null,
    }

    setPreviewData(processedData)
    onPreview(processedData)
    onValidate(true)

    toast({
      title: "Validação concluída",
      description: "Dados validados com sucesso!",
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Dados da Ponte do Cure</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="local">Local *</Label>
              <Input
                id="local"
                value={formData.local}
                onChange={(e) => handleInputChange("local", e.target.value)}
                placeholder="Ex: Ponte do Cure - Rio Miranda"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="data">Data *</Label>
              <Input
                id="data"
                type="date"
                value={formData.data}
                onChange={(e) => handleInputChange("data", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="chuva">Chuva (mm)</Label>
              <Input
                id="chuva"
                type="number"
                step="0.1"
                value={formData.chuva || ""}
                onChange={(e) => handleInputChange("chuva", e.target.value ? Number.parseFloat(e.target.value) : null)}
                placeholder="0.0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nivel">Nível (cm)</Label>
              <Input
                id="nivel"
                type="number"
                step="0.1"
                value={formData.nivel || ""}
                onChange={(e) => handleInputChange("nivel", e.target.value ? Number.parseFloat(e.target.value) : null)}
                placeholder="0.0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="visibilidade">Visibilidade</Label>
              <Input
                id="visibilidade"
                value={formData.visibilidade || ""}
                onChange={(e) => handleInputChange("visibilidade", e.target.value)}
                placeholder="Ex: Boa, Regular, Ruim"
              />
            </div>
          </div>

          <Button onClick={handleValidate} disabled={!formData.local.trim() || !formData.data} className="w-full">
            Validar Dados
          </Button>
        </CardContent>
      </Card>

      {previewData && (
        <Card>
          <CardHeader>
            <CardTitle>Preview dos Dados</CardTitle>
          </CardHeader>
          <CardContent>
            <TablePreview data={previewData} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
