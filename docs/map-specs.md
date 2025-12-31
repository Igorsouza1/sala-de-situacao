# 🗺️ Especificação de Renderização do Mapa (Frontend Specs)

**Autor:** Prisma Ambiental  
**Versão:** 1.5 (Atualizado com Categorização e Simbologia)  
**Contexto:** Unificação das Camadas (Static + Generic) via `LayerResponseDTO`.

---

## 1. Princípio Fundamental
O componente de Mapa (`map.tsx`) deve atuar como um **Componente Burro (Dumb Component)**. Ele não deve conter regras de negócio "hardcoded" sobre cores, nomes ou comportamentos específicos de camadas (ex: "se for bacia, pinte de azul").

Toda a inteligência de renderização deve ser derivada dinamicamente do objeto `visualConfig` e `schemaConfig` retornado pela API.
O Frontend (map.tsx) renderiza o que o Backend manda. Não existe if (layer.slug === 'acoes') no código do mapa. O Frontend deve ler visualConfig e aplicar a lógica: "Aplique o baseStyle. Se houver rules e o dado der match, sobrescreva com o estilo da regra."

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
  VisualConfig {
  // 1. Agrupamento e Comportamento Macro
  category: string;             // Ex: "Monitoramento", "Fiscalização", "Base Territorial"
  mapDisplay: 'all' | 'latest' | 'date_filter'; // Comportamento temporal padrão

  // 2. Estilo Base (O "Default" de qualquer feature dessa camada)
  baseStyle: {
    type: 'icon' | 'circle' | 'line' | 'polygon' | 'heatmap';
    
    // Propriedades visuais
    color: string;              // Cor principal (Borda ou Cor do Ícone)
    fillColor?: string;         // Cor de preenchimento (para polígonos/círculos)
    weight?: number;            // Espessura da borda/linha
    radius?: number;            // Tamanho (para type='point' ou 'circle')
    opacity?: number;           // Opacidade da linha/ícone (0-1)
    fillOpacity?: number;       // Opacidade do preenchimento (0-1)
    dashArray?: string;         // Tracejado (ex: '5, 5')
    
    // Ícone (Apenas se type='icon')
    iconName?: string;          // Nome do ícone Lucide (ex: 'alert-circle', 'waves')
  };

  // 3. Regras Condicionais (Opcional - Para Status, Turbidez crítica, etc)
  rules?: {
    field: string;              // Qual campo do GeoJSON analisar? (ex: 'status', 'turbidez')
    values: {
      [key: string]: {          // Mapeamento: Valor -> Override de Estilo
        color?: string;         // Sobrescreve a cor base
        fillColor?: string;     // Sobrescreve o preenchimento
        iconName?: string;      // Sobrescreve o ícone
        radius?: number;        // Sobrescreve o tamanho
      };
    };
  };

  // 4. Configuração de Popup/Tooltip
  popupFields?: Array<{
    key: string;                // Chave no GeoJSON
    label: string;              // Label para o usuário
    unit?: string;              // Sufixo (ex: " cm", " NTU")
    format?: 'date' | 'number'; // Dica de formatação
  }>;
  
  // 5. Configuração de Gráficos (Dashboard - Fora do escopo do Mapa, mas presente no JSON)
  charts?: Array<any>;
}

  // O que mostrar no Popup
  schemaConfig?: {
    fields: Array<{
      key: string;   // Chave da propriedade no GeoJSON
      label: string; // Título bonito
      type: 'text' | 'number' | 'date' | 'boolean';
    }>
  };
}