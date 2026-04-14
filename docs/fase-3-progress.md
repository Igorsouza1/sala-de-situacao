# Fase 3 — MapLibre Core: Engine Swap

## Status: 🔄 Em andamento

## Checklist

- [X] **3.0** — Criar arquivo de progresso
- [X] **3.1** — Adicionar `react-map-gl` a `transpilePackages` no `next.config.ts`
- [X] **3.2** — Extrair helpers puros `maplibre-layer.ts` + testes (23/23 GREEN)
- [X] **3.3** — Criar `MapLibreMap.tsx` consumindo `/api/map/layers`
- [X] **3.4** — Criar `components/map/index.tsx` com feature flag switch
- [X] **3.5** — Atualizar `app/protected/client-page.tsx` para importar do novo index
- [X] **3.6** — Validar paridade visual com `NEXT_PUBLIC_MAP_ENGINE=maplibre`
- [X] **3.7** — Verificar rollback com `NEXT_PUBLIC_MAP_ENGINE=leaflet`

---

## Arquivos Criados / Modificados

| Arquivo | Ação |
|---|---|
| `next.config.ts` | Adicionar `react-map-gl` a transpilePackages |
| `components/map/helpers/maplibre-layer.ts` | Novo — helpers puros de conversão de estilo |
| `components/map/__tests__/maplibre-layer.test.ts` | Novo — testes unitários dos helpers |
| `components/map/MapLibreMap.tsx` | Novo — componente MapLibre |
| `components/map/index.tsx` | Novo — entry point com feature flag |
| `app/protected/client-page.tsx` | Atualizar import |

---

## Critério de Conclusão

- [ ] `NEXT_PUBLIC_MAP_ENGINE=maplibre` renderiza todas as layers com cores corretas
- [ ] `NEXT_PUBLIC_MAP_ENGINE=leaflet` (rollback) funciona sem regressões
- [ ] Todos os testes passando (`npm test`)
- [ ] Build sem erros (`npm run build`)
- [ ] Dataset real de desmatamento renderiza sem travar

---

## Notas Técnicas

- `visualConfig` ainda está em formato Leaflet-style (`VisualStyle`) — será migrado para MapLibre-native na Fase 4
- `center` prop aceita `[lat, lng]` (mesma convenção que Leaflet) — conversão para `{longitude, latitude}` é feita internamente
- Sem lazy loading, clustering ou controles nesta fase — esses ficam para a Fase 5
