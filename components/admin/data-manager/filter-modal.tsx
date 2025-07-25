"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2 } from "lucide-react"

interface FilterRule {
  id: string
  column: string
  operator: string
  value: string
}

interface FilterModalProps {
  isOpen: boolean
  onClose: () => void
  columns: string[]
  onApplyFilters: (filters: Omit<FilterRule, "id">[]) => void
  currentFilters: Omit<FilterRule, "id">[]
}

const OPERATORS = [
  { value: "equals", label: "Igual a" },
  { value: "contains", label: "Contém" },
  { value: "startsWith", label: "Começa com" },
  { value: "endsWith", label: "Termina com" },
  { value: "notEquals", label: "Diferente de" },
  { value: "greaterThan", label: "Maior que" },
  { value: "lessThan", label: "Menor que" },
  { value: "greaterThanOrEqual", label: "Maior ou igual a" },
  { value: "lessThanOrEqual", label: "Menor ou igual a" },
]

export function FilterModal({ isOpen, onClose, columns, onApplyFilters, currentFilters }: FilterModalProps) {
  const [rules, setRules] = useState<FilterRule[]>([])

  useEffect(() => {
    if (isOpen) {
      setRules(currentFilters.map((f, i) => ({ ...f, id: `current-${i}-${Date.now()}` })))
    }
  }, [isOpen, currentFilters])

  const addRule = () => {
    if (columns.length > 0) {
      setRules([...rules, { id: `new-${Date.now()}`, column: columns[0], operator: OPERATORS[0].value, value: "" }])
    }
  }

  const updateRule = (id: string, field: keyof FilterRule, value: string) => {
    setRules(rules.map((rule) => (rule.id === id ? { ...rule, [field]: value } : rule)))
  }

  const removeRule = (id: string) => {
    setRules(rules.filter((rule) => rule.id !== id))
  }

  const handleApply = () => {
    const filtersToApply = rules.map(({ id, ...rest }) => rest)
    onApplyFilters(filtersToApply)
    onClose()
  }

  const availableColumns = columns.filter((col) => col !== "geom")

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Aplicar Filtros Avançados</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {rules.map((rule) => (
            <div key={rule.id} className="p-3 border rounded-md space-y-3 bg-muted/50">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                <div>
                  <Label htmlFor={`column-${rule.id}`}>Coluna</Label>
                  <Select value={rule.column} onValueChange={(value) => updateRule(rule.id, "column", value)}>
                    <SelectTrigger id={`column-${rule.id}`}>
                      <SelectValue placeholder="Selecione a coluna" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableColumns.map((col) => (
                        <SelectItem key={col} value={col}>
                          {col}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor={`operator-${rule.id}`}>Operador</Label>
                  <Select value={rule.operator} onValueChange={(value) => updateRule(rule.id, "operator", value)}>
                    <SelectTrigger id={`operator-${rule.id}`}>
                      <SelectValue placeholder="Selecione o operador" />
                    </SelectTrigger>
                    <SelectContent>
                      {OPERATORS.map((op) => (
                        <SelectItem key={op.value} value={op.value}>
                          {op.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor={`value-${rule.id}`}>Valor</Label>
                  <Input
                    id={`value-${rule.id}`}
                    value={rule.value}
                    onChange={(e) => updateRule(rule.id, "value", e.target.value)}
                    placeholder="Digite o valor"
                  />
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeRule(rule.id)}
                className="text-destructive hover:text-destructive-foreground hover:bg-destructive/90 w-full md:w-auto"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remover Regra
              </Button>
            </div>
          ))}
          {availableColumns.length === 0 && rules.length === 0 && (
            <p className="text-sm text-muted-foreground text-center">
              Selecione uma tabela para ver as colunas disponíveis para filtro.
            </p>
          )}
        </div>
        <Button variant="outline" onClick={addRule} disabled={availableColumns.length === 0}>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Regra de Filtro
        </Button>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleApply}>Aplicar Filtros</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
