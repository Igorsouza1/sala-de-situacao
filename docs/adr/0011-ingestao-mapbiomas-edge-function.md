# Ingestão MapBiomas Alerta como Supabase Edge Functions semanais

Replicação do padrão ADR 0009 (FIRMS) para Detecções de Desmatamento: duas Edge Functions standalone (`mapbiomas-sync`, `mapbiomas-notify`) disparadas por `pg_cron` + `pg_net`, uma vez por semana (segunda-feira, 07:00/07:30 UTC). Cadência semanal — e não diária como o FIRMS — porque a publicação de alertas do MapBiomas é semanal; rodar mais vezes só repetiria resultados. A janela de busca é de 35 dias por data de publicação, com dedup por `alertid`, para absorver runs perdidos e republicações.

A fonte é a API GraphQL (`https://plataforma.alerta.mapbiomas.org/api/v2/graphql`). Diferente do FIRMS (API key estática), o MapBiomas **não tem conta de serviço**: a autenticação é a mutation `signIn(email, password)` que devolve um Bearer token de sessão. Decisão: **login por execução** — as credenciais da conta (secrets `MAPBIOMAS_EMAIL`/`MAPBIOMAS_PASSWORD`) são trocadas por um token efêmero no início de cada run, que não é persistido. Isso elimina qualquer gestão de expiração/refresh de token; o custo é um `signIn` por semana, desprezível. A alternativa (persistir o token em tabela/secret e renovar quando expira) foi descartada por adicionar estado e um modo de falha novo sem benefício.

O filtro espacial acontece em duas fases, espelhando o pré-filtro barato + PostGIS do FIRMS: (1) a lista paginada de alertas vem **leve** (só `alertCode` + centroide `coordenates`), e o centroide é pré-filtrado em JS pelo bbox das regiões com padding de 0.5°; (2) a geometria (`geometryWkt`) é buscada **só dos candidatos**, em lotes por `alertCodes`, e o match preciso é do `ST_Intersects` contra `regioes.geom`. O parâmetro `boundingBox` da query `alerts` foi deliberadamente evitado: a ordem das coordenadas não é documentada e um erro silencioso de ordem zeraria o recall sem sinal de falha.

O armazenamento segue ADR 0008 (Dado de Base): upsert em `monitoramento.desmatamento` por `alertid` (índice único parcial criado na migration 0011), vínculo por região em `desmatamento_regioes` (junction idêntica a `firms_regioes`, com `alerta_enviado`/`notified_at` por região). Os dados históricos importados manualmente entram na junction já com `alerta_enviado = true` — a notificação retroativa de anos de histórico seria spam. A notificação usa Resend, filtrando destinatários por `preferencias->>'desmatamento'` (chave nova, backfilled como `true` na 0011).

## Considered Options

- **Login por execução via signIn** (escolhido): sem estado, sem gestão de expiração; um login semanal.
- **Persistir/renovar token** (descartado): estado extra e novo modo de falha (token expirado entre runs) sem ganho.
- **Filtro espacial via `boundingBox` da API** (descartado): ordem das coordenadas não documentada — risco de recall zero silencioso; o pré-filtro por centroide + `ST_Intersects` é verificável e segue o padrão FIRMS.
- **Download semanal do shapefile/CSV completo (`relatoryAlert`)** (descartado): payload nacional pesado e parsing de shapefile em Deno; a query `alerts` paginada com geometria sob demanda é mais simples e barata.
