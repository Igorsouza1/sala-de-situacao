# 🗺️ Especificação de Renderização do Mapa (Frontend Specs)

**Projeto:** Prisma Ambiental  
**Módulo:** Componente de Mapa (`map.tsx` / `MapLayerCard.tsx`)  
**Versão:** 1.6 (Estilo Base + Regras Condicionais)  
**Status:** Aprovado  

---

## 1. Princípio Arquitetural
O componente de Mapa deve atuar estritamente como um **Componente Burro (Dumb Component)**.

* ⛔ **Proibido:** Ter regras de negócio "hardcoded" (ex: `if (layer.slug === 'acoes') setIcon('alert')`).
* ✅ **Obrigatório:** Toda a inteligência de renderização (ícones, cores, tamanhos, popups) deve ser derivada dinamicamente do objeto `visualConfig` retornado pela API.

O fluxo de renderização é:
1.  Receber o GeoJSON e o `visualConfig`.
2.  Aplicar o estilo padrão (`baseStyle`).
3.  Verificar se existe alguma regra condicional (`rules`).
4.  Se houver *match* entre o dado e a regra, sobrescrever o estilo base.

---

## 2. Contrato de Dados (TypeScript Interfaces)

O Frontend consome uma lista de `LayerResponseDTO`. Abaixo está a definição de tipos atualizada.

```typescript
/**
 * DTO principal recebido pelo endpoint /api/mapLayers
 */
export interface LayerResponseDTO {
  id: number;
  slug: string;        // ID único (ex: 'acoes', 'bacia-rio-da-prata')
  name: string;        // Nome para exibição na Legenda
  ordering: number;    // Z-Index (1 = Fundo, 100 = Topo)
  
  // Define o agrupamento no menu (Accordion do LayerControl)
  category: 'Monitoramento' | 'Operacional' | 'Infraestrutura' | 'Base Territorial';

  data: GeoJSON.FeatureCollection; // O dado geográfico em si
  
  visualConfig: VisualConfig;      // O cérebro da renderização
  schemaConfig?: SchemaConfig;     // Configuração auxiliar de campos
}

/**
 * Configuração Visual Armazenada no Banco (JSONB)
 */
export interface VisualConfig {
  // 1. Comportamento Macro
  category: string;  // Categoria visual (pode ser redundante com o DTO, mas útil para o frontend)
  mapDisplay: 'all' | 'latest' | 'date_filter'; // Comportamento do filtro de tempo

  // 2. Estilo Base (Default para todas as features da camada)
  baseStyle: StyleProperties;

  // 3. Regras Condicionais (Opcional)
  // Permite mudar o estilo baseado no valor de uma propriedade (ex: status, tipo)
 rules?: Array<{
  field: string;          // Qual campo do GeoJSON analisar? (ex: 'eixo_tematico')
  styleProperty?: string; // (Opcional) Qual propriedade do estilo alterar? (ex: 'iconName' ou 'color')
                          // Se omitido, faz merge de todo o objeto de estilo.
  values: {
    [value: string]: string | Partial<StyleProperties>; 
    // Se styleProperty for definido, o valor é direto (ex: "sprout").
    // Se styleProperty não for definido, o valor é um objeto de estilo (ex: { color: "red" }).
  };
}>;
  // 4. Configuração de Popup
  popupFields?: Array<{
    key: string;               // Chave no properties do GeoJSON
    label: string;             // Título para o usuário
    unit?: string;             // Sufixo (ex: " cm", " NTU")
    format?: 'date' | 'number' | 'currency'; 
  }>;

  // 5. Configuração de Gráficos (Dashboard)
  charts?: Array<any>; 
}

/**
 * Propriedades de Estilo (Baseadas no Leaflet/Lucide)
 */
export interface StyleProperties {
  type: 'icon' | 'circle' | 'line' | 'polygon' | 'heatmap';
  
  // Cores e Dimensões
  color: string;           // Cor principal (Stroke ou Ícone)
  fillColor?: string;      // Cor de preenchimento
  weight?: number;         // Espessura da borda
  radius?: number;         // Raio (para circle/point)
  opacity?: number;        // Opacidade da borda/ícone (0.0 - 1.0)
  fillOpacity?: number;    // Opacidade do preenchimento (0.0 - 1.0)
  dashArray?: string;      // Tracejado (ex: '5, 5')
  
  // Ícones (Apenas se type='icon')
  iconName?: string;       // Nome do ícone da lib Lucide-React (ex: 'sprout', 'alert-triangle')
}

export interface SchemaConfig {
  fields: Array<{
    key: string;
    label: string;
    type: 'text' | 'number' | 'date' | 'boolean';
  }>;
}

---

## 3. Centralização de Lógica Visual (`helpers/map-visuals.tsx`)

Para garantir consistência visual entre os diferentes mapas (`map.tsx`, `PropriedadeMap.tsx`, `dossie-map.tsx`), **TODAS** as renderizações devem utilizar as funções auxiliares centralizadas.

### 3.1. Funções Core

*   **`getLayerStyle(visualConfig, feature?)`**: Retorna um objeto de estilo Leaflet (`PathOptions`) pronto para ser usado em `<GeoJSON style={...} />`. Processa `baseStyle` e aplica `rules` condicionalmente se uma `feature` for passada.
*   **`getPointToLayer(visualConfig, slug)`**: Retorna uma função para a prop `pointToLayer` do Leaflet. Gerencia a criação de Marcadores (`L.marker`, `L.circleMarker`) e Ícones customizados.
*   **`resolveFeatureStyle(visualConfig, feature?)`**: Função de baixo nível que retorna o "estado final" de estilo da feature (cor, icone, etc) após aplicar todas as regras. Útil para componentes que precisam apenas da cor/ícone resolvida (ex: `Marker` isolado).
*   **`createCustomIcon(iconName, color)`**: Gera um `L.DivIcon` padronizado usando a biblioteca Lucide-React.
*   **`getLayerLegendInfo(visualConfig)`**: Extrai metadados para exibição em legendas/controles (ex: qual ícone mostrar no menu lateral, qual a cor base).

### 3.2. Padrão de Uso

#### Em Mapas com GeoJSON Completo (ex: `map.tsx`)
```tsx
<GeoJSON
  data={data}
  style={(feature) => getLayerStyle(config, feature)}
  pointToLayer={getPointToLayer(config, slug)}
/>
```

#### Em Mapas com Marcadores Isolados (ex: `PropriedadeMap.tsx`)
```tsx
// 1. Resolver o estilo final baseada nas props do objeto
const style = resolveFeatureStyle(config, { properties: item });
// 2. Gerar o ícone
const icon = createCustomIcon(style.iconName, style.color);

return <Marker position={...} icon={icon} />
```

#### Estilos Padrão (Hardcoded/Fallback)
Para camadas que não vêm do banco (ex: Polígono da Propriedade no Dossiê), deve-se usar as constantes exportadas de `helpers/map-visuals.tsx`:
*   `PROPRIEDADE_STYLE_CONFIG`
*   `BANHADO_STYLE_CONFIG`

Iso garante que se decidirmos mudar a cor da propriedade de "Amber" para "Blue", mudamos em apenas um lugar.
