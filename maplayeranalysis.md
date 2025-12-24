Análise de Arquitetura: Manipulação de Camadas no Mapa
Este documento detalha o fluxo de dados "ponta a ponta" (End-to-End) das camadas do mapa, desde a requisição API até a renderização no componente React Leaflet.

1. Visão Geral do Fluxo de Dados
O fluxo segue uma arquitetura unidirecional clássica: Database -> Repository -> Service -> API Route -> Client Context -> Hook -> UI Component

Diagrama Simplificado
SQL
Raw Data
GeoJSON
JSON
Raw State
Filtered Data
Render
PostgreSQL
Repositories
Services
API Routes
GeoDataContext
useMapFilters
Map Component
Leaflet Layers
2. Detalhamento Passo a Passo
Passo 1: API & Services (Backend)
O backend é responsável por buscar os dados brutos e já formatá-los como GeoJSON FeatureCollections.

Arquivos Chave:

app/api/mapLayers/route.ts
: Endpoint para camadas estáticas/base.
app/api/acoes/route.ts
: Endpoint para camadas dinâmicas (Ações).
lib/service/mapLayerService.ts
: Converte linhas do banco em estruturas GeoJSON padrão.
lib/service/acoesService.ts
: Agrupa ações por categoria antes de enviar.
Como funciona:

O mapLayerService itera sobre tabelas conhecidas (estradas, bacia, etc.) e mapeia colunas SQL para properties do GeoJSON.
A geometria já vem processada (presumivelmente via PostGIS) ou é parseada de strings.
Passo 2: Gerenciamento de Estado (Context API)
O Frontend carrega todos os dados de uma vez na inicialização (Estratégia "Fetch-All").

Arquivo Chave: 
context/GeoDataContext.tsx
Como funciona:
O 
MapProvider
 dispara 
fetchMapData
, 
fetchExpedicoesData
, e 
fetchAcoesData
 no useEffect inicial.
Armazena os dados brutos em estados grandes (mapData, acoesData).
Provê esses dados para toda a árvore de componentes.
Passo 3: Filtragem e Processamento (Client-Side)
Os dados brutos são refinados antes de chegarem ao mapa.

Arquivo Chave: 
hooks/useMapFilters.ts
Como funciona:
Recebe os dados brutos do Contexto + Filtros de Data.
Usa useMemo para recalcular apenas quando necessário.
Ações: Realiza um "Flattening" (transforma o objeto agrupado em array plano) para renderização de marcadores, e simultaneamente calcula contagens para o menu "Agrupado".
Desmatamento/Firms: Filtra arrays gigantes baseado no range de datas selecionado isDatePropWithinRange.
Passo 4: Renderização (UI Component)
O componente visual apenas consome os dados já prontos.

Arquivo Chave: 
components/map/map.tsx
Como funciona:
Controla visibilidade via estado local (visibleLayers, visibleActionTypes).
Itera sobre os dados filtrados (do Hook) e renderiza componentes do react-leaflet:
GeoJSON
: Para polígonos/linhas (Bacias, Estradas).
Marker: Para pontos (Ações, Expedições).
CircleMarker: Para pontos massivos (Focos de incêndio).
3. Análise Crítica
✅ Pontos Positivos
Separação de Responsabilidades: O 
map.tsx
 é limpo e focado em apresentação. Lógica pesada de filtro está isolada no hook.
Uso de GeoJSON Standard: O backend já entrega no formato que o Leaflet consome nativamente, reduzindo processamento no cliente.
Memoização: O uso correto de useMemo em 
useMapFilters
 previne re-renderizações desnecessárias durante interações simples de UI.
Sistema de Ícones Dinâmico: A função 
createActionIcon
 gera SVGs complexos on-the-fly, permitindo estilos visuais ricos sem carregar assets estáticos pesados.
⚠️ Pontos de Atenção & Negativos
Client-Side Filtering (Gargalo de Performance):
Problema: O app baixa TUDO (todas as queimadas, todas as datas) e filtra no navegador.
Risco: Se a base de dados crescer (ex: 100k pontos de desmatamento), o browser vai travar no load inicial ou ao mudar o filtro de data.
Payload Inicial Grande:
O fetchMapLayers retorna um JSON gigante com múltiplas camadas. O usuário espera o mapa todo carregar, mesmo que só queira ver uma camada simples.
Renderização de Pontos (DOM Nodes):
Usar Marker e L.divIcon cria elementos DOM para cada ponto. Com muitos pontos (>1000), o mapa ficará lento (janky) ao arrastar/zoom.
4. Recomendações de Melhoria
Curto Prazo (High Impact / Low Effort)
Virtualização ou Clustering:
Aplicar react-leaflet-cluster para as camadas de pontos (Ações e Firms). Isso agrupa pontos próximos e evita criar milhares de DOM nodes.
Separação de Endpoints:
Quebrar /api/mapLayers em rotas menores ou permitir query params. Ex: /api/layer/bacia, /api/layer/desmatamento. Carregar apenas o que está visível/ativado.
Lazy Loading:
Carregar MapContainer e camadas pesadas apenas quando visíveis ou interativas.
Médio/Longo Prazo (Arquitetural)
Server-Side Filtering:
Mover o filtro de data para a API: /api/desmatamento?start=2024-01&end=2024-02.
Isso reduz drasticamente o tráfego de rede e uso de memória no cliente.
Vector Tiles (Se os dados ficarem gigantes):
Para polígonos complexos ou milhões de pontos, migrar de GeoJSON para MVT (Mapbox Vector Tiles) servidos pelo PostGIS.
Resumo da Ação Sugerida
O código atual é excelente para MVP e volumes de dados moderados. É limpo e bem estruturado. A principal preocupação futura deve ser Escalabilidade de Dados.