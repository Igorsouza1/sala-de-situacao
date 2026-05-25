Nível 2 — Implementar na próxima semana (médio impacto)

  2a. propriedades desligada por padrão
  É a camada mais pesada e a menos usada no dia a dia. Mudar initializedRef para não incluí-la na lista de visible por
  default — usuário ativa quando precisa.

  2b. Migrar propriedades e desmatamento para MVT
  O endpoint /api/tiles/[slug]/[z]/[x]/[y] já está construído. MVT carrega apenas o tile visível no viewport, em binary
  comprimido. Para datasets grandes como propriedades, a redução é de 95%+ vs GeoJSON full.

  ---
  Nível 3 — Monitorar / avaliar

  3a. bbox filtering no GeoJSON
  Aceitar ?bbox=minLng,minLat,maxLng,maxLat e filtrar com ST_Intersects(geom, ST_MakeEnvelope(...)). Útil se o mapa for
  usado em zoom alto com poucos features visíveis.