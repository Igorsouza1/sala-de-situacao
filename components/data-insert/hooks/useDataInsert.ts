"use client"

import { useState } from "react"

type DataType = "estrada" | "ponteCure" | "dequePedras" | "acoes"

export function useDataInsert() {
  const [selectedType, setSelectedType] = useState<DataType | null>(null)
  const [currentStep, setCurrentStep] = useState(1)
  const [isValidated, setIsValidated] = useState(false)
  const [previewData, setPreviewData] = useState<any>(null)

  const resetState = () => {
    setSelectedType(null)
    setCurrentStep(1)
    setIsValidated(false)
    setPreviewData(null)
  }

  const canProceedToNext = () => {
    switch (currentStep) {
      case 1:
        return selectedType !== null
      case 2:
        return isValidated
      case 3:
        return previewData !== null
      case 4:
        return true
      default:
        return false
    }
  }

  return {
    selectedType,
    setSelectedType,
    currentStep,
    setCurrentStep,
    isValidated,
    setIsValidated,
    previewData,
    setPreviewData,
    resetState,
    canProceedToNext,
  }
}
