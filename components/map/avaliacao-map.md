# Avaliação Senior: Sistema de Camadas e Mapa

## 1. Visão Geral da Arquitetura Atual

O sistema opera em um modelo híbrido onde o backend centraliza a configuração (LayerCatalog) e algumas estratégias de busca (STATIC_STRATEGIES), mas delega responsabilidades críticas de processamento de dados e filtragem para o frontend. Embora funcional para volumes de dados pequenos, essa arquitetura apresenta riscos sérios de escalabilidade e performance (gargalos de CPU no cliente e I/O desnecessário no banco).

## 2. Pontos Críticos e Gargalos (Critical Hots)

### A. Lógica de "Latest" no Frontend (Grave)

No arquivo `map.tsx` (linhas 449–460), existe uma lógica para exibir apenas o dado mais recente (`mapDisplay === 'latest'`).

// map.tsx  
if (layer.visualConfig?.mapDisplay === 'latest') {  
&nbsp;&nbsp;const sorted = [...displayData.features].sort(...)  
&nbsp;&nbsp;displayData = { ...displayData, features: sorted.slice(0, 1) };  
}

**Problema:**  
O backend transfere todo o histórico de dados (potencialmente milhares de registros) para o frontend via rede, apenas para o JavaScript descartar 99,9% deles e mostrar um único ponto.

**Solução:**  
Mover essa estratégia para o `layerService.ts` ou diretamente para a query SQL (ex: window functions ou DISTINCT ON). O frontend deve receber apenas o que vai renderizar.

### B. Filtragem de Data Redundante

O `fetchLayers` no `map.tsx` já envia `startDate` e `endDate` para a API. No entanto, o próprio `map.tsx` (linhas 421–443) realiza uma nova filtragem de data no cliente.

**Problemas:**

- Redundância: Se a API já filtra, o cliente não deveria precisar refiltrar.  
- Inconsistência: Se a API não filtra corretamente e confiamos no cliente, estamos trafegando dados inúteis (over-fetching).  
- Performance: Iterar sobre milhares de features no render loop do React trava a thread principal.

### C. Construção de GeoJSON em Memória (Node.js)

No `layerService.ts`, a função `toFeatureCollection` sugere que o backend busca linhas do banco (array de objetos) e itera sobre elas no Node.js para montar o JSON.

**Problema:**  
Para camadas densas (ex: Desmatamento, Estradas), isso consome muita RAM do servidor e CPU para serialização.

**Solução:**  
Utilizar funções nativas do PostGIS como `ST_AsGeoJSON` e `json_agg` diretamente na query SQL. O banco é ordens de magnitude mais rápido para isso.

### D. Render Loop Pesado no Map

O `LayerManager` é visualmente eficiente, mas o `map.tsx` recalcula a visibilidade e filtros dentro do loop de renderização (linhas 392–494).

**Problema:**  
Cada interação de UI que força um re-render (ex: abrir um modal) dispara filtros em arrays potencialmente grandes.

**Solução:**  
Memoizar os dados filtrados (`useMemo`) separadamente da renderização dos componentes `<GeoJSON />`.

## 3. O Que Deve Ir para o Backend? (Migração Prioritária)

| Funcionalidade | Onde está hoje? | Onde deveria estar? | Por quê? |
|---|---|---|---|
| Filtro "Latest" | Frontend (map.tsx) | Backend (SQL/Service) | Economia brutal de banda e processamento |
| Filtro de Datas | Híbrido | Backend Total | Eliminar processamento no cliente e over-fetching |
| Agrupamento (GroupBy) | Híbrido (Service busca grupos, Map filtra) | Backend (API com Params) | Se o usuário filtrar por "Categoria A", o backend deve retornar apenas dados da "Categoria A". Hoje o backend manda tudo e o front esconde |
| Formatação GeoJSON | Node.js Helper | PostgreSQL (SQL) | Performance de serialização e menor uso de RAM |
| Determinação de Ícones | Frontend (getVisuals & Config) | Backend (DTO) | O DTO já deveria entregar a URL/nome do ícone resolvido, sem lógica condicional no front |

## 4. Análise de Código e Manutenibilidade

### layerService.ts

**Ponto forte:**  
O uso de `STATIC_STRATEGIES` é um bom padrão (Strategy Pattern).

**Melhoria:**  
A função `getLayerGroups` faz queries separadas. Poderia ser otimizada ou cacheada, pois categorias mudam pouco.

### map.tsx

**Hardcoded Fallbacks:**  
Linhas 116–124 (`if slug === 'firms'...`) quebram o princípio Data Driven. Se uma nova camada surgir, é necessário editar o código React. Isso deve ir para a configuração no banco (`visual_config`).

**Lógica de Negócio na View:**  
A função `getVisuals` (linha 272) contém regras de negócio sobre quais ícones usar para quais slugs parciais (`fiscaliz`, `recupera`, etc.). Isso deveria ser calculado no backend e retornado explicitamente nos groups.

### LayerManager.tsx

**Componente sólido:**  
Bem desacoplado e focado em apresentação.

**Atenção:**  
A lógica de `handleGroupCheckbox` (linhas 288–300) é um pouco complexa para um componente de UI, mas aceitável dado que gerencia seleção em massa.

## 5. Plano de Ação Recomendado

- Refatorar Estratégias (Backend): Implementar lógica de data e "latest" dentro das `STATIC_STRATEGIES` usando SQL eficiente.  
- Limpar o Frontend: Remover toda lógica de `features.filter` do `map.tsx`. O componente deve apenas renderizar o que recebe.  
- Data-Driven Styling Total: Mover as regras `if (slug === 'firms')` para dentro do `layer_catalog` no banco de dados, garantindo que o front seja agnóstico.  
- Otimização de Query: Converter endpoints para usar `ST_AsGeoJSON`.

Esta análise foca em transformar o sistema em uma arquitetura **Server-Side Filtering, Client-Side Rendering**, que é o padrão da indústria para GIS performático.
