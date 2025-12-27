# 🗺️ Especificação de Renderização do Mapa (Frontend Specs)

**Autor:** Prisma Ambiental  
**Versão:** 1.0  
**Contexto:** Unificação das Camadas (Static + Generic) via `LayerResponseDTO`.

---

## 1. Princípio Fundamental
O componente de Mapa (`map.tsx`) deve atuar como um **Componente Burro (Dumb Component)**. Ele não deve conter regras de negócio "hardcoded" sobre cores, nomes ou comportamentos específicos de camadas (ex: "se for bacia, pinte de azul").

Toda a inteligência de renderização deve ser derivada dinamicamente do objeto `visualConfig` e `schemaConfig` retornado pela API.

---

## 2. O Objeto de Entrada (DTO)
O Frontend receberá uma lista de camadas. Cada camada segue este contrato:

```typescript
interface LayerResponseDTO {
  id: number;
  slug: string;        // Identificador único (ex: 'acoes', 'bacia-rio-da-prata')
  name: string;        // Nome para exibição na Legenda
  ordering: number;    // Z-Index (1 = Fundo, 100 = Topo)
  
  data: GeoJSON.FeatureCollection; // O dado geográfico em si
  
  // Como desenhar (Cores, Ícones, Filtros)
  visualConfig: {
    mapDisplay?: 'all' | 'latest' | 'date_filter';
    dateFilter?: boolean; 
    mapMarker?: {
      type: 'polygon' | 'line' | 'point' | 'circle';
      color?: string;      // Cor da Borda/Linha
      fillColor?: string;  // Cor do Preenchimento
      weight?: number;     // Espessura da linha
      opacity?: number;    // Opacidade da linha
      fillOpacity?: number;// Opacidade do preenchimento
      radius?: number;     // Apenas para type='circle'
    };
    // ... configurações de gráficos (ignoradas pelo Mapa, usadas pelo Dashboard)
  };

  // O que mostrar no Popup
  schemaConfig?: {
    fields: Array<{
      key: string;  // Chave da propriedade no GeoJSON
      label: string; // Título bonito
      type: 'text' | 'number' | 'date' | 'boolean';
    }>
  };
}