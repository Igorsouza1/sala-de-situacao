# 🗺️ Especificação de Renderização do Mapa (Frontend Specs)

**Autor:** Prisma Ambiental  
**Versão:** 1.1 (Atualizado com Categorização e Simbologia)  
**Contexto:** Unificação das Camadas (Static + Generic) via `LayerResponseDTO`.

---

## 1. Princípio Fundamental
O componente de Mapa (`map.tsx`) deve atuar como um **Componente Burro (Dumb Component)**. Ele não deve conter regras de negócio "hardcoded" sobre cores, nomes ou comportamentos específicos de camadas (ex: "se for bacia, pinte de azul").

Toda a inteligência de renderização deve ser derivada dinamicamente do objeto `visualConfig` e `schemaConfig` retornado pela API.

---

## 2. O Objeto de Entrada (DTO)
O Frontend receberá uma lista de camadas. O contrato foi expandido para suportar agrupamento semântico e simbologia avançada:

```typescript
interface LayerResponseDTO {
  id: number;
  slug: string;        // Identificador único (ex: 'acoes', 'bacia-rio-da-prata')
  name: string;        // Nome para exibição na Legenda
  ordering: number;    // Z-Index (1 = Fundo, 100 = Topo)
  
  // 🔥 NOVO: Define o agrupamento no menu (Accordion)
  category: 'Monitoramento' | 'Operacional' | 'Infraestrutura' | 'Base Territorial';

  data: GeoJSON.FeatureCollection; // O dado geográfico em si
  
  // Como desenhar (Cores, Ícones, Filtros)
  visualConfig: {
    mapDisplay?: 'all' | 'latest' | 'date_filter';
    dateFilter?: boolean; 
    
    // 🔥 ATUALIZADO: Define a simbologia na Legenda e no Mapa
    mapMarker?: {
      type: 'polygon' | 'line' | 'point' | 'circle';
      icon?: string;       // Nome do ícone (ex: 'waves', 'activity') para type='point'
      color?: string;      // Cor principal (Stroke/Borda)
      fillColor?: string;  // Cor do Preenchimento
      weight?: number;     // Espessura da linha
      opacity?: number;    // Opacidade da linha
      fillOpacity?: number;// Opacidade do preenchimento
      radius?: number;     // Raio (apenas para type='point' ou 'circle')
      dashArray?: string;  // Tracejado (ex: '5, 5')
      pulse?: boolean;     // Se true, animação de pulso (ex: Focos de Incêndio)
    };
    
    // Configurações de gráficos (ignoradas pelo Mapa, usadas pelo Dashboard)
    charts?: Array<any>;
  };

  // O que mostrar no Popup
  schemaConfig?: {
    fields: Array<{
      key: string;   // Chave da propriedade no GeoJSON
      label: string; // Título bonito
      type: 'text' | 'number' | 'date' | 'boolean';
    }>
  };
}