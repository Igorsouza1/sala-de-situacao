// Supabase Edge Function: mapbiomas-sync (ADR 0011)
// Ingestão semanal de Detecções de Desmatamento do MapBiomas Alerta.
// Standalone (Deno) — não importa nada do app Next.js.
//
// Pipeline:
//   1. signIn na API GraphQL (login por execução — a API não tem service
//      account; o token efêmero vive só durante o run)
//   2. Fetch paginado dos alertas publicados na janela (lista leve, sem
//      geometria — só alertCode + centroide)
//   3. Pré-filtro barato por bbox das regiões (em JS, pelo centroide,
//      com padding — o match preciso é do PostGIS no passo 5)
//   4. Fetch da geometria (WKT) só dos candidatos, por alertCodes
//   5. Staging em temp table + upsert em desmatamento via ST_Intersects
//      com regioes.geom + links em desmatamento_regioes
//
// Env (Supabase secrets):
//   SUPABASE_DB_URL      — connection string Postgres (pooler, porta 6543)
//   MAPBIOMAS_EMAIL      — conta MapBiomas Alerta (plataforma.alerta.mapbiomas.org)
//   MAPBIOMAS_PASSWORD   — senha da conta
//   CRON_SECRET          — bearer token exigido no request (pg_cron envia)

import postgres from "npm:postgres@3.4.5";

const MAPBIOMAS_GRAPHQL_URL = "https://plataforma.alerta.mapbiomas.org/api/v2/graphql";

// Janela de busca por data de PUBLICAÇÃO. A publicação do MapBiomas é
// semanal e o cron roda toda segunda — 35 dias dão folga para runs
// perdidos e republicações; o dedup por alertid absorve a sobreposição.
const PUBLISHED_WINDOW_DAYS = 35;

// Padding do bbox em graus (~50 km): o pré-filtro usa o CENTROIDE do
// alerta, que pode cair fora do bbox das regiões mesmo quando o polígono
// intersecta uma região na borda.
const BBOX_PADDING_DEG = 0.5;

const PAGE_LIMIT = 200;
const GEOMETRY_CHUNK = 50;

interface AlertSummary {
  alertCode: number;
  areaHa: number | null;
  detectedAt: string | null;
  publishedAt: string | null;
  sources: string[] | null;
  coordenates: { latitude: number | null; longitude: number | null } | null;
}

async function graphql<T>(query: string, variables: Record<string, unknown>, token?: string): Promise<T> {
  const res = await fetch(MAPBIOMAS_GRAPHQL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`MapBiomas GraphQL HTTP ${res.status}: ${await res.text()}`);
  const json = await res.json();
  if (json.errors?.length) throw new Error(`MapBiomas GraphQL: ${JSON.stringify(json.errors)}`);
  return json.data as T;
}

async function signIn(email: string, password: string): Promise<string> {
  const data = await graphql<{ signIn: { token: string } }>(
    `mutation ($email: String!, $password: String!) {
      signIn(email: $email, password: $password) { token }
    }`,
    { email, password },
  );
  return data.signIn.token;
}

async function fetchPublishedAlerts(token: string, startDate: string, endDate: string): Promise<AlertSummary[]> {
  const all: AlertSummary[] = [];
  let page = 1;
  let totalPages = 1;
  do {
    const data = await graphql<{
      alerts: { metadata: { totalPages: number }; collection: AlertSummary[] };
    }>(
      `query ($startDate: BaseDate, $endDate: BaseDate, $page: Int, $limit: Int) {
        alerts(startDate: $startDate, endDate: $endDate, dateType: PublishedAt, page: $page, limit: $limit) {
          metadata { totalPages }
          collection {
            alertCode
            areaHa
            detectedAt
            publishedAt
            sources
            coordenates { latitude longitude }
          }
        }
      }`,
      { startDate, endDate, page, limit: PAGE_LIMIT },
      token,
    );
    all.push(...data.alerts.collection);
    totalPages = data.alerts.metadata.totalPages;
    page++;
  } while (page <= totalPages);
  return all;
}

async function fetchGeometries(token: string, alertCodes: number[]): Promise<Map<number, string>> {
  const geoms = new Map<number, string>();
  for (let i = 0; i < alertCodes.length; i += GEOMETRY_CHUNK) {
    const chunk = alertCodes.slice(i, i + GEOMETRY_CHUNK);
    const data = await graphql<{
      alerts: { collection: { alertCode: number; geometryWkt: string | null }[] };
    }>(
      `query ($alertCodes: [ID!], $limit: Int) {
        alerts(alertCodes: $alertCodes, limit: $limit) {
          collection { alertCode geometryWkt }
        }
      }`,
      { alertCodes: chunk.map(String), limit: chunk.length },
      token,
    );
    for (const a of data.alerts.collection) {
      if (a.geometryWkt) geoms.set(a.alertCode, a.geometryWkt);
    }
  }
  return geoms;
}

Deno.serve(async (req) => {
  const cronSecret = Deno.env.get("CRON_SECRET");
  if (cronSecret && req.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
  }

  const email = Deno.env.get("MAPBIOMAS_EMAIL");
  const password = Deno.env.get("MAPBIOMAS_PASSWORD");
  const dbUrl = Deno.env.get("SUPABASE_DB_URL");
  if (!email || !password || !dbUrl) {
    return new Response(
      JSON.stringify({ error: "missing MAPBIOMAS_EMAIL, MAPBIOMAS_PASSWORD or SUPABASE_DB_URL" }),
      { status: 500 },
    );
  }

  const sql = postgres(dbUrl, { prepare: false });

  try {
    // 1. Login por execução (token efêmero)
    const token = await signIn(email, password);

    // 2. Lista leve da janela de publicação
    const endDate = new Date().toISOString().split("T")[0];
    const startDate = new Date(Date.now() - PUBLISHED_WINDOW_DAYS * 86_400_000)
      .toISOString().split("T")[0];
    const allAlerts = await fetchPublishedAlerts(token, startDate, endDate);

    // 3. Pré-filtro por bbox agregado das regiões (com padding)
    const [bbox] = await sql`
      SELECT ST_XMin(e) AS min_lon, ST_YMin(e) AS min_lat,
             ST_XMax(e) AS max_lon, ST_YMax(e) AS max_lat
      FROM (SELECT ST_Extent(geom) AS e FROM monitoramento.regioes) t
    `;
    const candidates = bbox?.min_lon == null ? [] : allAlerts.filter((a) => {
      const lat = a.coordenates?.latitude;
      const lon = a.coordenates?.longitude;
      return lat != null && lon != null &&
        lon >= bbox.min_lon - BBOX_PADDING_DEG && lon <= bbox.max_lon + BBOX_PADDING_DEG &&
        lat >= bbox.min_lat - BBOX_PADDING_DEG && lat <= bbox.max_lat + BBOX_PADDING_DEG;
    });

    let inserted = 0;
    let linked = 0;

    if (candidates.length > 0) {
      // 4. Geometria só dos candidatos
      const geoms = await fetchGeometries(token, candidates.map((a) => a.alertCode));

      const rows = candidates
        .filter((a) => geoms.has(a.alertCode))
        .map((a) => ({
          alertid: String(a.alertCode),
          alertcode: String(a.alertCode),
          alertha: a.areaHa,
          source: a.sources?.join(",") ?? null,
          detectat: a.detectedAt,
          detectyear: a.detectedAt ? parseInt(a.detectedAt.slice(0, 4), 10) : null,
          geom_wkt: geoms.get(a.alertCode)!,
        }));

      if (rows.length > 0) {
        await sql.begin(async (tx) => {
          // 5. Staging + upsert + links (padrão firms-sync)
          await tx`
            CREATE TEMP TABLE desmatamento_staging (
              alertid text, alertcode text, alertha double precision,
              source text, detectat text, detectyear int, geom_wkt text
            ) ON COMMIT DROP
          `;
          const CHUNK = 200;
          for (let i = 0; i < rows.length; i += CHUNK) {
            await tx`INSERT INTO desmatamento_staging ${tx(rows.slice(i, i + CHUNK))}`;
          }

          //  - ST_MakeValid: polígonos do MapBiomas podem chegar inválidos e
          //    quebrariam o ST_Intersects.
          //  - DO UPDATE no-op: garante RETURNING id também para detecções já
          //    existentes (republicações) — os links de região delas ainda
          //    precisam ser criados para regiões novas.
          //  - Colunas antigas regiao_id/tenant_id NÃO são escritas:
          //    a fonte de verdade do vínculo é desmatamento_regioes.
          const result = await tx`
            WITH matched AS (
              SELECT s.alertid, s.alertcode, s.alertha, s.source, s.detectat, s.detectyear,
                     ST_MakeValid(ST_SetSRID(ST_GeomFromText(s.geom_wkt), 4674)) AS geom
              FROM desmatamento_staging s
              WHERE EXISTS (
                SELECT 1 FROM monitoramento.regioes r
                WHERE ST_Intersects(ST_MakeValid(ST_SetSRID(ST_GeomFromText(s.geom_wkt), 4674)), r.geom)
              )
            ),
            upserted AS (
              INSERT INTO monitoramento.desmatamento
                (alertid, alertcode, alertha, source, detectat, detectyear, geom)
              SELECT alertid, alertcode, alertha, source, detectat, detectyear, geom
              FROM matched
              ON CONFLICT (alertid) WHERE alertid IS NOT NULL
                DO UPDATE SET alertid = EXCLUDED.alertid
              RETURNING id, geom, (xmax = 0) AS is_new
            ),
            linked AS (
              INSERT INTO monitoramento.desmatamento_regioes (desmatamento_id, regiao_id)
              SELECT u.id, r.id
              FROM upserted u
              JOIN monitoramento.regioes r ON ST_Intersects(u.geom, r.geom)
              ON CONFLICT (desmatamento_id, regiao_id) DO NOTHING
              RETURNING desmatamento_id
            )
            SELECT
              (SELECT count(*) FROM upserted WHERE is_new)::int AS inserted,
              (SELECT count(*) FROM linked)::int AS linked
          `;
          inserted = result[0]?.inserted ?? 0;
          linked = result[0]?.linked ?? 0;
        });
      }
    }

    const body = { status: "success", fetched: allAlerts.length, candidates: candidates.length, inserted, linked };
    console.log("mapbiomas-sync done", body);
    return new Response(JSON.stringify(body), { headers: { "Content-Type": "application/json" } });
  } catch (err) {
    console.error("mapbiomas-sync error", err);
    return new Response(JSON.stringify({ status: "error", message: String(err) }), { status: 500 });
  } finally {
    await sql.end();
  }
});
