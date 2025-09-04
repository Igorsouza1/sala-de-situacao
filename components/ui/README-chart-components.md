# Componentes de Gráficos Reutilizáveis

Esta pasta contém componentes reutilizáveis para criar gráficos consistentes no dashboard.

## 📁 Organização dos Arquivos

### **`chart-core.tsx`** - Core do Recharts
- `ChartContainer` - Container principal para gráficos
- `ChartTooltipContent` - Tooltip padronizado

### **`chart-states.tsx`** - Estados dos Gráficos
- `ChartLoadingState` - Estado de carregamento
- `ChartErrorState` - Estado de erro
- `ChartEmptyState` - Estado vazio

### **`chart-ui.tsx`** - Interface dos Gráficos
- `ChartLayout` - Layout principal com card e painel lateral
- `ChartPeriodFilter` - Filtro de período (7d, 15d, 30d)
- `ChartStatusBadge` - Badge de status desatualizado
- `ChartInfoPanel` - Painel lateral com informações
- `ChartLegend` - Legenda para gráficos

## Componentes Disponíveis

### 1. **ChartLayout**
Layout principal para gráficos com card principal e painel lateral opcional.

```tsx
import { ChartLayout } from "@/components/ui/chart-components"

<ChartLayout
  title="Título do Gráfico"
  statusBadge={<ChartStatusBadge />}
  sidebar={<ChartInfoPanel />}
>
  {/* Conteúdo do gráfico */}
</ChartLayout>
```

### 2. **ChartLoadingState**
Estado de carregamento padronizado.

```tsx
import { ChartLoadingState } from "@/components/ui/chart-components"

<ChartLoadingState height="h-64" />
```

### 3. **ChartErrorState**
Estado de erro padronizado.

```tsx
import { ChartErrorState } from "@/components/ui/chart-components"

<ChartErrorState error="Mensagem de erro" />
```

### 4. **ChartEmptyState**
Estado vazio padronizado.

```tsx
import { ChartEmptyState } from "@/components/ui/chart-components"

<ChartEmptyState message="Nenhum dado disponível" />
```

### 5. **ChartPeriodFilter**
Filtro de período (7d, 15d, 30d).

```tsx
import { ChartPeriodFilter } from "@/components/ui/chart-components"

<ChartPeriodFilter
  value={selectedPeriod}
  onValueChange={setSelectedPeriod}
  options={[
    { label: "7 d", value: 7 },
    { label: "15 d", value: 15 },
    { label: "30 d", value: 30 },
  ]}
/>
```

### 6. **ChartStatusBadge**
Badge para mostrar status de dados desatualizados.

```tsx
import { ChartStatusBadge } from "@/components/ui/chart-components"

<ChartStatusBadge 
  lastUpdate="31/07/2025" 
  daysOutdated={19} 
/>
```

### 7. **ChartInfoPanel**
Painel lateral com informações explicativas.

```tsx
import { ChartInfoPanel } from "@/components/ui/chart-components"

<ChartInfoPanel
  title="Faixas de Turbidez"
  items={[
    { label: "Excelente", range: "0-3 NTU", color: "#10b98133" },
    { label: "Boa", range: "4-7 NTU", color: "#eab30833" },
  ]}
/>
```

### 8. **ChartLegend**
Legenda para gráficos.

```tsx
import { ChartLegend } from "@/components/ui/chart-components"

<ChartLegend
  items={[
    { color: "#3b82f6", label: "Turbidez (NTU)" },
    { color: "#f59e0b", label: "Secchi (m)" },
  ]}
/>
```

### 9. **ChartContainer & ChartTooltipContent**
Container e tooltip para gráficos Recharts.

```tsx
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart-components"

<ChartContainer config={chartConfig} className="h-[300px]">
  <ResponsiveContainer>
    <BarChart data={data}>
      <Tooltip content={<ChartTooltipContent />} />
      {/* Outros componentes do gráfico */}
    </BarChart>
  </ResponsiveContainer>
</ChartContainer>
```

## Exemplo Completo

```tsx
import { 
  ChartLayout,
  ChartLoadingState,
  ChartErrorState,
  ChartEmptyState,
  ChartPeriodFilter,
  ChartStatusBadge,
  ChartInfoPanel,
  ChartLegend,
  ChartContainer,
  ChartTooltipContent
} from "@/components/ui/chart-components"

export function MeuGrafico() {
  const { data, isLoading, error } = useMeusDados()

  if (isLoading) return <ChartLoadingState />
  if (error) return <ChartErrorState error={error} />
  if (!data.length) return <ChartEmptyState />

  return (
    <ChartLayout
      title="Meu Gráfico"
      statusBadge={<ChartStatusBadge lastUpdate="..." daysOutdated={5} />}
      sidebar={<ChartInfoPanel title="Info" items={[]} />}
    >
      <ChartPeriodFilter value={period} onValueChange={setPeriod} options={[]} />
      
      <ChartContainer config={{}} className="h-[300px]">
        {/* Gráfico Recharts */}
      </ChartContainer>
      
      <ChartLegend items={[]} />
    </ChartLayout>
  )
}
```

## Padrões de Uso

1. **Sempre use os estados padronizados** para loading, error e empty
2. **Use ChartLayout** para gráficos que precisam de título e painel lateral
3. **Mantenha consistência** nas cores e estilos
4. **Reutilize componentes** sempre que possível
5. **Documente configurações específicas** do seu gráfico
