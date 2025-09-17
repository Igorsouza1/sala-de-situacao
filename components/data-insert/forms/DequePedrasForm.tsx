"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TablePreview } from "../preview/TablePreview"
import { useToast } from "@/hooks/use-toast"
import { deriveMes } from "../utils/date"

type DequePedrasFormValues = {
  data: string
  turbidez?: number | null
  secchiVertical?: number | null
  secchiHorizontal?: number | null
  chuva?: number | null
}

interface DequePedrasFormProps {
  onValidate: (isValid: boolean) => void
  onPreview: (data: any) => void
}

export function DequePedrasForm({ onValidate, onPreview }: DequePedrasFormProps) {
  const [formData, setFormData] = useState<DequePedrasFormValues>({
    data: new Date().toISOString().split("T")[0],
    turbidez: 0,
    secchiVertical: 0,
    secchiHorizontal: 0,
    chuva: 0,
  })
  const [previewData, setPreviewData] = useState<any>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleInputChange = (field: keyof DequePedrasFormValues, value: string | number | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    onValidate(false) // reset validação ao editar
  }

  const buildPayload = (base: DequePedrasFormValues) => ({
    ...base,
    mes: deriveMes(base.data),
    turbidez: base.turbidez ?? null,
    secchiVertical: base.secchiVertical ?? null,
    secchiHorizontal: base.secchiHorizontal ?? null,
    chuva: base.chuva ?? null,
  })

  const handleValidate = () => {
    if (!formData.data) {
      toast({
        title: "Campo obrigatório",
        description: "A data é obrigatória.",
        variant: "destructive",
      })
      return
    }

    const processed = buildPayload(formData)
    setPreviewData(processed)
    onPreview(processed)
    onValidate(true)

    toast({
      title: "Validação concluída",
      description: "Dados validados com sucesso!",
    })
  }

  const handleSubmit = async () => {
    if (!previewData) {
      toast({
        title: "Valide antes de salvar",
        description: "Clique em “Validar Dados” para conferir o payload.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)


      toast({
        title: "Salvo",
        description: "Registro criado com sucesso.",
      })

      // opcional: resetar o formulário
      setFormData({
        data: new Date().toISOString().split("T")[0],
        turbidez: 0,
        secchiVertical: 0,
        secchiHorizontal: 0,
        chuva: 0,
      })
      setPreviewData(null)
      onValidate(false)
    } catch (err: any) {
      toast({
        title: "Erro ao salvar",
        description: err?.message ?? "Não foi possível salvar agora.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Dados do Deque de Pedras</CardTitle>
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
                step="0.1"
                value={formData.turbidez ?? ""}
                onChange={(e) =>
                  handleInputChange("turbidez", e.target.value ? Number.parseFloat(e.target.value) : null)
                }
                placeholder="0.0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="chuva">Chuva (mm)</Label>
              <Input
                id="chuva"
                type="number"
                step="0.1"
                value={formData.chuva ?? ""}
                onChange={(e) => handleInputChange("chuva", e.target.value ? Number.parseFloat(e.target.value) : null)}
                placeholder="0.0"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="secchiVertical">Secchi Vertical (cm)</Label>
              <Input
                id="secchiVertical"
                type="number"
                step="0.1"
                value={formData.secchiVertical ?? ""}
                onChange={(e) =>
                  handleInputChange("secchiVertical", e.target.value ? Number.parseFloat(e.target.value) : null)
                }
                placeholder="0.0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="secchiHorizontal">Secchi Horizontal (cm)</Label>
              <Input
                id="secchiHorizontal"
                type="number"
                step="0.1"
                value={formData.secchiHorizontal ?? ""}
                onChange={(e) =>
                  handleInputChange("secchiHorizontal", e.target.value ? Number.parseFloat(e.target.value) : null)
                }
                placeholder="0.0"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button onClick={handleValidate} disabled={!formData.data} className="w-full">
              Validar Dados
            </Button>
            <Button onClick={handleSubmit} disabled={!previewData || isSubmitting} className="w-full">
              {isSubmitting ? "Salvando..." : "Salvar"}
            </Button>
          </div>
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
