export type RegionIdParseResult = { ok: true; id: number | null } | { ok: false };

/** Missing means no override; malformed IDs must never fall back to another region. */
export function parseRegionIdInput(raw: unknown): RegionIdParseResult {
  if (raw === undefined || raw === null) return { ok: true, id: null };
  if (typeof raw !== "string" || !/^[1-9]\d*$/.test(raw)) return { ok: false };
  const id = Number(raw);
  return Number.isSafeInteger(id) ? { ok: true, id } : { ok: false };
}

/** Reject duplicate query parameters instead of silently choosing one. */
export function parseRegiaoIdParam(searchParams: URLSearchParams): RegionIdParseResult {
  const values = searchParams.getAll("regiao_id");
  if (values.length === 0) return { ok: true, id: null };
  if (values.length !== 1) return { ok: false };
  return parseRegionIdInput(values[0]);
}
