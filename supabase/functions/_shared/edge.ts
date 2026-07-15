// Esqueleto comum das Edge Functions de cron (ADR 0009/0011).
// Standalone (Deno) — compartilhado só entre functions, nunca com o app Next.js.
//
// Cobre o que era duplicado verbatim entre firms-*/mapbiomas-*:
//   - Auth por CRON_SECRET (bearer enviado pelo pg_cron)
//   - Checagem de env vars obrigatórias
//   - Cliente postgres com try/catch/finally sql.end()
//   - Envelope de resposta JSON + logging padronizado

import postgres from "npm:postgres@3.4.5";

export type Sql = ReturnType<typeof postgres>;

type CronHandler = (ctx: {
  sql: Sql;
  env: Record<string, string>;
  req: Request;
}) => Promise<Record<string, unknown>>;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Registra o Deno.serve de uma function de cron.
 * `requiredEnv` NÃO deve incluir SUPABASE_DB_URL nem CRON_SECRET — o primeiro
 * é sempre exigido aqui; o segundo é opcional (sem ele, auth é pulada em dev).
 * O handler devolve o corpo de sucesso; exceções viram resposta 500.
 */
export function serveCron(name: string, requiredEnv: string[], handler: CronHandler): void {
  Deno.serve(async (req) => {
    const cronSecret = Deno.env.get("CRON_SECRET");
    if (cronSecret && req.headers.get("authorization") !== `Bearer ${cronSecret}`) {
      return json({ error: "unauthorized" }, 401);
    }

    const env: Record<string, string> = {};
    const missing: string[] = [];
    for (const key of ["SUPABASE_DB_URL", ...requiredEnv]) {
      const value = Deno.env.get(key);
      if (!value) missing.push(key);
      else env[key] = value;
    }
    if (missing.length) {
      return json({ error: `missing ${missing.join(", ")}` }, 500);
    }

    const sql = postgres(env.SUPABASE_DB_URL, { prepare: false });
    try {
      const body = await handler({ sql, env, req });
      console.log(`${name} done`, body);
      return json(body);
    } catch (err) {
      console.error(`${name} error`, err);
      return json({ status: "error", message: String(err) }, 500);
    } finally {
      await sql.end();
    }
  });
}

export interface RegionsBbox {
  min_lon: number;
  min_lat: number;
  max_lon: number;
  max_lat: number;
}

/**
 * Bbox agregado das Regiões — pré-filtro barato em JS antes do match
 * preciso do PostGIS. Retorna null quando não há regiões com geometria.
 */
export async function fetchRegionsBbox(sql: Sql): Promise<RegionsBbox | null> {
  const [bbox] = await sql`
    SELECT ST_XMin(e) AS min_lon, ST_YMin(e) AS min_lat,
           ST_XMax(e) AS max_lon, ST_YMax(e) AS max_lat
    FROM (SELECT ST_Extent(geom) AS e FROM monitoramento.regioes) t
  `;
  return bbox?.min_lon == null ? null : (bbox as unknown as RegionsBbox);
}

/** Teste de pertencimento ao bbox, com padding opcional em graus. */
export function inBbox(
  bbox: RegionsBbox,
  lat: number | null | undefined,
  lon: number | null | undefined,
  paddingDeg = 0,
): boolean {
  return lat != null && lon != null &&
    lon >= bbox.min_lon - paddingDeg && lon <= bbox.max_lon + paddingDeg &&
    lat >= bbox.min_lat - paddingDeg && lat <= bbox.max_lat + paddingDeg;
}
