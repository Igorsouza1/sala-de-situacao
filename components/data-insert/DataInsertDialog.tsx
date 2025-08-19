"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { TypeSelector } from "./TypeSelector"
import { EstradaForm } from "./forms/EstradaForm"
import { PonteCureForm } from "./forms/PonteCureForm"
import { DequePedrasForm } from "./forms/DequePedrasForm"
import { AcoesForm } from "./forms/AcoesForm"
import { useDataInsert } from "./hooks/useDataInsert"
import { useToast } from "@/hooks/use-toast"

interface DataInsertDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function DataInsertDialog({ isOpen, onClose }: DataInsertDialogProps) {
  const { toast } = useToast()
  const {
    selectedType,
    setSelectedType,
    currentStep,
    setCurrentStep,
    resetState,
    canProceedToNext,
    isValidated,
    setIsValidated,
    previewData,
    setPreviewData,
  } = useDataInsert()

  const [isSubmitting, setIsSubmitting] = useState(false)

  const steps = [
    { number: 1, title: "Tipo", description: "Selecione o tipo de dado" },
    { number: 2, title: "Formulário", description: "Preencha os dados" },
    { number: 3, title: "Preview", description: "Valide e visualize" },
    { number: 4, title: "Confirmação", description: "Salve os dados" },
  ]

  const handleClose = () => {
    resetState()
    onClose()
  }

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      if (currentStep === 3) {
        setIsValidated(false)
        setPreviewData(null)
      }
    }
  }

  const handleFinalSubmit = async () => {
    if (!selectedType || !previewData) return

    setIsSubmitting(true)
    try {
      const endpoint = {
        estrada: "/api/estradas",
        ponteCure: "/api/ponte-do-cure",
        dequePedras: "/api/deque-pedras",
        acoes: "/api/acoes",
      }[selectedType]

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(previewData),
      })

      if (!response.ok) {
        throw new Error("Erro ao salvar dados")
      }

      toast({
        title: "Sucesso!",
        description: "Dados salvos com sucesso.",
      })

      handleClose()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <TypeSelector selectedType={selectedType} onTypeSelect={setSelectedType} />
      case 2:
        switch (selectedType) {
          case "estrada":
            return <EstradaForm onValidate={setIsValidated} onPreview={setPreviewData} />
          case "ponteCure":
            return <PonteCureForm onValidate={setIsValidated} onPreview={setPreviewData} />
          case "dequePedras":
            return <DequePedrasForm onValidate={setIsValidated} onPreview={setPreviewData} />
          case "acoes":
            return <AcoesForm onValidate={setIsValidated} onPreview={setPreviewData} />
          default:
            return null
        }
      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Preview dos Dados</h3>
            {previewData && (
              <pre className="bg-gray-100 p-4 rounded-md text-sm overflow-auto max-h-96">
                {JSON.stringify(previewData, null, 2)}
              </pre>
            )}
          </div>
        )
      case 4:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Confirmação</h3>
            <p className="text-muted-foreground">Confirme os dados antes de salvar. Esta ação não pode ser desfeita.</p>
            {previewData && (
              <div className="bg-gray-50 p-4 rounded-md">
                <p>
                  <strong>Tipo:</strong> {selectedType}
                </p>
                <p>
                  <strong>Dados validados:</strong> Sim
                </p>
              </div>
            )}
          </div>
        )
      default:
        return null
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Inserção Dinâmica de Dados</DialogTitle>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-6">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium
                ${currentStep >= step.number ? "bg-primary text-primary-foreground" : "bg-gray-200 text-gray-600"}`}
              >
                {step.number}
              </div>
              <div className="ml-2 hidden sm:block">
                <div className="text-sm font-medium">{step.title}</div>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-12 h-0.5 mx-4 ${currentStep > step.number ? "bg-primary" : "bg-gray-200"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto">{renderStepContent()}</div>

        {/* Footer Actions */}
        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={currentStep === 1 ? handleClose : handleBack} disabled={isSubmitting}>
            {currentStep === 1 ? (
              "Cancelar"
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Voltar
              </>
            )}
          </Button>

          <Button
            onClick={currentStep === 4 ? handleFinalSubmit : handleNext}
            disabled={!canProceedToNext() || isSubmitting}
          >
            {isSubmitting ? (
              "Salvando..."
            ) : currentStep === 4 ? (
              "Salvar Dados"
            ) : (
              <>
                Próximo
                <ChevronRight className="h-4 w-4 ml-1" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
