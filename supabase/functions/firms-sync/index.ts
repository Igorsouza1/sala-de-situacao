// Supabase Edge Function: firms-sync (ADR 0009)
// Ingestão diária de focos de calor da NASA FIRMS.
// Standalone (Deno) — não importa nada do app Next.js.
//
// Pipeline:
//   1. Fetch CSV do dia (VIIRS_NOAA20_NRT / world / 1 dia)
//   2. Pré-filtro barato por bbox das regiões (em JS, só pra reduzir volume)
//   3. Staging em temp table na mesma transação
//   4. Upsert em raw_firms via ST_Intersects com regioes.geom (PostGIS decide
//      o match — ponto em N regiões sobrepostas gera N links, sem loop manual)
//   5. Links em firms_regioes (novos E já-existentes, via RETURNING id)
//   6. Enriquecimento CAR (cod_imovel via ST_Intersects com propriedades)
//
// Env (Supabase secrets):
//   SUPABASE_DB_URL      — connection string Postgres (pooler, porta 6543)
//   NASA_FIRMS_MAP_KEY   — chave da API FIRMS
//   CRON_SECRET          — bearer token exigido no request (pg_cron envia)

import postgres from "npm:postgres@3.4.5";

const FIRMS_BASE_URL = "https://firms.modaps.eosdis.nasa.gov/api/area/csv";

interface FirmsRow {
  latitude: number;
  longitude: number;
  bright_ti4: number | null;
  scan: number | null;
  track: number | null;
  acq_date: string;
  acq_time: string;
  satellite: string | null;
  instrument: string | null;
  confidence: string | null;
  version: string | null;
  bright_ti5: number | null;
  frp: number | null;
  daynight: string | null;
}

function num(v: string | undefined): number | null {
  if (v == null || v === "") return null;
  const n = parseFloat(v);
  return Number.isNaN(n) ? null : n;
}

// CSV do FIRMS não tem campos com aspas/vírgulas embutidas — split simples basta.
function parseCsv(text: string): FirmsRow[] {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim());
  const idx = (name: string) => headers.indexOf(name);

  const iLat = idx("latitude"), iLon = idx("longitude"), iDate = idx("acq_date"), iTime = idx("acq_time");
  const rows: FirmsRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const c = lines[i].split(",");
    const latitude = num(c[iLat]);
    const longitude = num(c[iLon]);
    const acq_date = c[iDate]?.trim();
    const acq_time = c[iTime]?.trim();
    if (latitude == null || longitude == null || !acq_date || !acq_time) continue;
    rows.push({
      latitude,
      longitude,
      bright_ti4: num(c[idx("bright_ti4")]),
      scan: num(c[idx("scan")]),
      track: num(c[idx("track")]),
      acq_date,
      acq_time,
      satellite: c[idx("satellite")]?.trim() || null,
      instrument: c[idx("instrument")]?.trim() || null,
      confidence: c[idx("confidence")]?.trim() || null,
      version: c[idx("version")]?.trim() || null,
      bright_ti5: num(c[idx("bright_ti5")]),
      frp: num(c[idx("frp")]),
      daynight: c[idx("daynight")]?.trim() || null,
    });
  }
  return rows;
}

Deno.serve(async (req) => {
  const cronSecret = Deno.env.get("CRON_SECRET");
  if (cronSecret && req.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
  }

  const mapKey = Deno.env.get("NASA_FIRMS_MAP_KEY");
  const dbUrl = Deno.env.get("SUPABASE_DB_URL");
  if (!mapKey || !dbUrl) {
    return new Response(JSON.stringify({ error: "missing NASA_FIRMS_MAP_KEY or SUPABASE_DB_URL" }), { status: 500 });
  }

  const sql = postgres(dbUrl, { prepare: false });

  try {
    // 1. Fetch CSV do dia
    const today = new Date().toISOString().split("T")[0];
    const url = `${FIRMS_BASE_URL}/${mapKey}/VIIRS_NOAA20_NRT/world/1/${today}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`FIRMS fetch failed: ${res.status} ${res.statusText}`);
    const allRows = parseCsv(await res.text());

    // 2. Pré-filtro por bbox agregado das regiões (reduz o dataset mundial
    //    antes de tocar o banco; o match preciso é do PostGIS no passo 4)
    const [bbox] = await sql`
      SELECT ST_XMin(e) AS min_lon, ST_YMin(e) AS min_lat,
             ST_XMax(e) AS max_lon, ST_YMax(e) AS max_lat
      FROM (SELECT ST_Extent(geom) AS e FROM monitoramento.regioes) t
    `;
    const candidates = bbox?.min_lon == null ? [] : allRows.filter((r) =>
      r.longitude >= bbox.min_lon && r.longitude <= bbox.max_lon &&
      r.latitude >= bbox.min_lat && r.latitude <= bbox.max_lat
    );

    let inserted = 0;
    let linked = 0;

    if (candidates.length > 0) {
      await sql.begin(async (tx) => {
        // 3. Staging
        await tx`
          CREATE TEMP TABLE firms_staging (
            latitude double precision, longitude double precision,
            bright_ti4 double precision, scan double precision, track double precision,
            acq_date date, acq_time text, satellite text, instrument text,
            confidence text, version text, bright_ti5 double precision,
            frp double precision, daynight text
          ) ON COMMIT DROP
        `;
        const CHUNK = 1000;
        for (let i = 0; i < candidates.length; i += CHUNK) {
          await tx`INSERT INTO firms_staging ${tx(candidates.slice(i, i + CHUNK))}`;
        }

        // 4 + 5. Upsert dos focos que caem em pelo menos uma região + links.
        //  - DISTINCT ON: o CSV pode repetir a chave natural; ON CONFLICT não
        //    tolera a mesma linha duas vezes no mesmo comando.
        //  - DO UPDATE no-op: garante RETURNING id também para focos que já
        //    existiam (DO NOTHING não devolve a linha em conflito).
        //  - Colunas antigas regiao_id/alerta_enviado/tenant_id NÃO são
        //    escritas aqui: a fonte de verdade do vínculo é firms_regioes.
        const links = await tx`
          WITH matched AS (
            SELECT DISTINCT ON (s.latitude, s.longitude, s.acq_date, s.acq_time)
              s.*, ST_SetSRID(ST_MakePoint(s.longitude, s.latitude), 4674) AS geom
            FROM firms_staging s
            WHERE EXISTS (
              SELECT 1 FROM monitoramento.regioes r
              WHERE ST_Intersects(ST_SetSRID(ST_MakePoint(s.longitude, s.latitude), 4674), r.geom)
            )
          ),
          upserted AS (
            INSERT INTO monitoramento.raw_firms
              (latitude, longitude, bright_ti4, scan, track, acq_date, acq_time,
               satellite, instrument, confidence, version, bright_ti5, frp, daynight, type, geom)
            SELECT latitude, longitude, bright_ti4, scan, track, acq_date, acq_time,
                   satellite, instrument, confidence, version, bright_ti5, frp, daynight, '0', geom
            FROM matched
            ON CONFLICT (latitude, longitude, acq_date, acq_time)
              DO UPDATE SET acq_date = EXCLUDED.acq_date
            RETURNING id, geom, (xmax = 0) AS is_new
          ),
          linked AS (
            INSERT INTO monitoramento.firms_regioes (firm_id, regiao_id)
            SELECT u.id, r.id
            FROM upserted u
            JOIN monitoramento.regioes r ON ST_Intersects(u.geom, r.geom)
            ON CONFLICT (firm_id, regiao_id) DO NOTHING
            RETURNING firm_id
          )
          SELECT
            (SELECT count(*) FROM upserted WHERE is_new)::int AS inserted,
            (SELECT count(*) FROM linked)::int AS linked
        `;
        inserted = links[0]?.inserted ?? 0;
        linked = links[0]?.linked ?? 0;
      });

      // 6. Enriquecimento CAR (mesma lógica da implementação antiga)
      await sql`
        UPDATE monitoramento.raw_firms AS rf
        SET cod_imovel = p.cod_imovel
        FROM monitoramento.propriedades AS p
        WHERE rf.cod_imovel IS NULL
          AND ST_Intersects(rf.geom, ST_Transform(p.geom, 4674))
      `;
    }

    const body = { status: "success", fetched: allRows.length, candidates: candidates.length, inserted, linked };
    console.log("firms-sync done", body);
    return new Response(JSON.stringify(body), { headers: { "Content-Type": "application/json" } });
  } catch (err) {
    console.error("firms-sync error", err);
    return new Response(JSON.stringify({ status: "error", message: String(err) }), { status: 500 });
  } finally {
    await sql.end();
  }
});
