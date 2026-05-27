 Diagnóstico — por que os dois mapas mostram a mesma coisa

  São 5 pontos de falha em cascata, todos precisam ser resolvidos juntos:

  ┌─────┬──────────────────────────────────────────────────────────────────────┬─────────────────────────────────────┐
  │  #  │                               Problema                               │                Onde                 │
  ├─────┼──────────────────────────────────────────────────────────────────────┼─────────────────────────────────────┤
  │ 1   │ Botão "Acessar" vai para /?region=X mas o mapa está em /protected    │ app/admin/page.tsx                  │
  ├─────┼──────────────────────────────────────────────────────────────────────┼─────────────────────────────────────┤
  │ 2   │ app/protected/page.tsx não lê searchParams — regionId nunca chega ao │ app/protected/page.tsx              │
  │     │  mapa                                                                │                                     │
  ├─────┼──────────────────────────────────────────────────────────────────────┼─────────────────────────────────────┤
  │ 3   │ map.tsx's fetchLayers() nunca manda regiao_id para a API             │ components/map/map.tsx              │
  ├─────┼──────────────────────────────────────────────────────────────────────┼─────────────────────────────────────┤
  │ 4   │ getAllLayers() busca todas as entradas do catálogo sem filtrar por   │ lib/service/layerService.ts:237-240 │
  │     │ região                                                               │                                     │
  ├─────┼──────────────────────────────────────────────────────────────────────┼─────────────────────────────────────┤
  │ 5   │ Mapa nunca centra na geometria da nova região — fica centrado em     │ components/map/map.tsx:50           │
  │     │ Bonito ([-21.3, -56.7])                                              │                                     │
  └─────┴──────────────────────────────────────────────────────────────────────┴─────────────────────────────────────┘

  ---
  Plano em 4 fases ordenadas por dependência

  Fase A — Cadeia URL → Contexto → Prop (3 arquivos, sem lógica nova)

  /protected?region=2
    → page.tsx lê searchParams.region
      → client-page.tsx recebe regionId
        → DynamicMap recebe regionId
          → GeoDataContext recebe regionId

  - app/admin/page.tsx: /?region= → /protected?region=
  - app/protected/page.tsx: async Page({ searchParams }) → extrai region
  - app/protected/client-page.tsx: repassa regionId para DynamicMap
  - GeoDataContext.tsx: adiciona regionId: number | null ao contexto

  Fase B — API calls com regiao_id (1 arquivo)

  - map.tsx: fetchLayers() e fetchLayer(slug) passam regiao_id=${regionId} quando disponível

  Fase C — Filtro do catálogo por região (1 arquivo, o mais impactante)

  getAllLayers() hoje: SELECT * FROM layer_catalog (sem filtro nenhum)

  Novo comportamento:
  WHERE regiao_id = :regionId          -- layers desta região
     OR regiao_id IS NULL              -- layers globais/compartilhadas (ex: limites)

  Isso isola completamente os layers de cada região. Bonito não vê layers de Serra do Amolar e vice-versa.

  Fase D — Viewport centrando na região (1 novo endpoint + 1 change no mapa)

  - Novo endpoint GET /api/map/region/[id] → retorna { center, bounds } via ST_Centroid + ST_Envelope
  - map.tsx ao montar com regionId: busca bounds e chama map.fitBounds(bounds)

  ---
  Impacto no banco

  Nenhuma migração necessária. A coluna layer_catalog.regiao_id já existe. Os layers da região de Bonito já têm
  regiao_id=1. Os da Serra do Amolar precisarão ser criados com regiao_id=2.

  ---
  Pergunta antes de implementar

  Os layers globais (ex: limites territoriais que valem para qualquer região) devem ser layers com regiao_id IS NULL, ou
   você prefere uma abordagem diferente para compartilhar layers entre regiões?

  E sobre a criação de layers para uma nova região — isso passa pelo admin de layer catalog existente, ou quer um fluxo
  específico para "clonar/configurar layers ao criar uma região"?