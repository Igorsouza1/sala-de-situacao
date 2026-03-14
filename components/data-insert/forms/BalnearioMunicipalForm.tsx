"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TablePreview } from "../preview/TablePreview"
import { useToast } from "@/hooks/use-toast"
import { deriveMes } from "../utils/date"

type BalnearioFormValues = {
  data: string
  turbidez?: number | null
  secchiVertical?: number | null
  nivelAgua?: number | null
  pluviometria?: number | null
  observacao?: string | null
}

interface BalnearioMunicipalFormProps {
  onValidate: (isValid: boolean) => void
  onPreview: (data: any) => void
}

export function BalnearioMunicipalForm({ onValidate, onPreview }: BalnearioMunicipalFormProps) {
  const [formData, setFormData] = useState<BalnearioFormValues>({
    data: new Date().toISOString().split("T")[0],
    turbidez: null,
    secchiVertical: null,
    nivelAgua: null,
    pluviometria: null,
    observacao: null,
  })
  const [previewData, setPreviewData] = useState<any>(null)
  const { toast } = useToast()

  const handleInputChange = (field: keyof BalnearioFormValues, value: string | number | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    onValidate(false)
  }

  const buildPayload = (base: BalnearioFormValues) => ({
    ...base,
    mes: deriveMes(base.data),
  })

  const handleValidate = () => {
    if (!formData.data) {
      toast({ title: "Campo obrigatório", description: "A data é obrigatória.", variant: "destructive" })
      return
    }

    const processed = buildPayload(formData)
    setPreviewData(processed)
    onPreview(processed)
    onValidate(true)

    toast({ title: "Validação concluída", description: "Dados validados com sucesso!" })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Dados do Balneário Municipal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="turbidez">Turbidez (NTU)</Label>
              <Input
                id="turbidez"
                type="number"
                step="0.01"
                value={formData.turbidez ?? ""}
                onChange={(e) =>
                  handleInputChange("turbidez", e.target.value ? parseFloat(e.target.value) : null)
                }
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="secchiVertical">Disco de Secchi Vertical (m)</Label>
              <Input
                id="secchiVertical"
                type="number"
                step="0.01"
                value={formData.secchiVertical ?? ""}
                onChange={(e) =>
                  handleInputChange("secchiVertical", e.target.value ? parseFloat(e.target.value) : null)
                }
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nivelAgua">Nível da Água (cm)</Label>
              <Input
                id="nivelAgua"
                type="number"
                step="0.1"
                value={formData.nivelAgua ?? ""}
                onChange={(e) =>
                  handleInputChange("nivelAgua", e.target.value ? parseFloat(e.target.value) : null)
                }
                placeholder="0.0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pluviometria">Pluviometria (mm)</Label>
              <Input
                id="pluviometria"
                type="number"
                step="0.1"
                value={formData.pluviometria ?? ""}
                onChange={(e) =>
                  handleInputChange("pluviometria", e.target.value ? parseFloat(e.target.value) : null)
                }
                placeholder="0.0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacao">Observação</Label>
            <Textarea
              id="observacao"
              value={formData.observacao ?? ""}
              onChange={(e) => handleInputChange("observacao", e.target.value || null)}
              placeholder="Observações adicionais..."
              rows={3}
            />
          </div>

          <Button onClick={handleValidate} disabled={!formData.data} className="w-full">
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
