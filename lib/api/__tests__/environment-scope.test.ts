jest.mock("@/lib/supabase/server", () => ({ createClient: jest.fn() }));
jest.mock("@/db", () => ({ db: { execute: jest.fn(), select: jest.fn() } }));
jest.mock("@/lib/api/require-region", () => ({ getRegionIdForUser: jest.fn().mockResolvedValue(null), getAccessibleRegionIdsForUser: jest.fn().mockResolvedValue([11]), getRegionIdsForUser: jest.fn().mockResolvedValue([11]) }));
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { PgDialect } from "drizzle-orm/pg-core";
import { GET as catalog } from "@/app/api/layers/route";
import { POST as write } from "@/app/api/layers/[slug]/data/route";
import { GET as heatmap } from "@/app/api/map/heatmap/fauna-exotica/route";
import { GET as regions } from "@/app/api/mapLayers/regioes/route";
import { getLayerCatalog, findAllLayersCatalog } from "@/lib/repositories/layerRepository";
import { getRegionIdsForUser } from "@/lib/api/require-region";
const where = jest.fn();
let rows: any[] = [];
function user(value: any = { id: "u1", app_metadata: { tenant_id: "org-a" } }) {
  (createClient as jest.Mock).mockResolvedValue({ auth: { getUser: jest.fn().mockResolvedValue({ data: { user: value }, error: null }) } });
}
function predicate(index = 0) {
  return new PgDialect().sqlToQuery(where.mock.calls[index][0]);
}
const params = { params: Promise.resolve({ slug: "private" }) };
const req = () => new Request("http://localhost/layers/private/data", { method: "POST", body: JSON.stringify({ geojson: { type: "Point", coordinates: [0, 0] }, properties: {} }) });
beforeEach(() => {
  jest.clearAllMocks(); rows = []; user();
  (db.execute as jest.Mock).mockReset().mockResolvedValue({ rows: [{ ok: false }] }).mockResolvedValueOnce({ rows: [{ tenant_id: "org-a" }] });
  const chain: any = { from: () => chain, where: (condition: any) => { where(condition); return chain; }, orderBy: () => Promise.resolve(rows), limit: () => Promise.resolve(rows), then: (resolve: any) => Promise.resolve(rows).then(resolve) };
  (db.select as jest.Mock).mockReturnValue(chain);
});
test.each([catalog, heatmap, regions])("read endpoints require a session", async (get) => {
  user(null); expect((await get()).status).toBe(401); expect(db.select).not.toHaveBeenCalled();
});
test("write endpoint requires a session", async () => {
  user(null); expect((await write(req() as any, params)).status).toBe(401); expect(db.select).not.toHaveBeenCalled();
});
test.each(["viewer", "auditor"])("%s cannot write layer data", async () => {
  expect((await write(req() as any, params)).status).toBe(403); expect(db.execute).toHaveBeenCalledTimes(1);
});
test("catalog includes own organization and global layers via SQL predicate", async () => {
  await catalog(); const q = predicate();
  expect(q.params).toEqual(["org-a", "global"]);
  expect(q.sql).toContain('"tenant_id" ='); expect(q.sql).toContain('"tenant_id" is null');
  expect(q.sql).toContain('"scope" =');
});
test("slug lookup retains catalog organization isolation", async () => {
  await getLayerCatalog("private", "org-a"); const q = predicate();
  expect(q.params).toEqual(["private", "org-a", "global"]);
  expect(q.sql).toContain('"tenant_id" is null'); expect(q.sql).toContain('"scope" =');
});
test("heatmap filters both actions and sightings by organization", async () => {
  await heatmap();
  expect(where).toHaveBeenCalledTimes(2);
  expect(predicate(0).params).toContain("org-a"); expect(predicate(1).params).toEqual(["org-a"]);
  expect(predicate(0).sql).toContain('"acoes"."tenant_id"'); expect(predicate(1).sql).toContain('"javali_avistamentos"."tenant_id"');
});
test("region list restricts to assigned regions inside organization", async () => {
  await regions(); const q = predicate();
  expect(q.params).toEqual(["org-a", 11]); expect(getRegionIdsForUser).toHaveBeenCalledWith("u1", "org-a");
});
test("region list fails closed with no assigned regions", async () => {
  (getRegionIdsForUser as jest.Mock).mockResolvedValueOnce([]);
  const response = await regions(); expect(await response.json()).toEqual([]); expect(db.select).not.toHaveBeenCalled();
});
test("owner sees only own organization regions", async () => {
  (db.execute as jest.Mock).mockResolvedValue({ rows: [{ ok: true }] });
  await regions(); expect(predicate().params).toEqual(["org-a"]);
});
test("editor cannot write a global layer", async () => {
  // First select validates the editor role; second finds the global catalog entry.
  rows = [{ id: 1, tenantId: null }];
  const response = await write(req() as any, params);
  expect(response.status).toBe(403); expect(db.execute).toHaveBeenCalledTimes(1);
});
test("editor cannot write a legacy global layer with tenant_id populated", async () => {
  rows = [{ id: 1, tenantId: "org-a", scope: "global" }];
  expect((await write(req() as any, params)).status).toBe(403);
  expect(db.execute).toHaveBeenCalledTimes(1);
});
test("editor writes own layer with catalog tenant, not request tenant", async () => {
  rows = [{ id: 1, tenantId: "org-a" }];
  const response = await write(req() as any, params);
  expect(response.status).toBe(200);
  const q = new PgDialect().sqlToQuery((db.execute as jest.Mock).mock.calls.at(-1)[0]);
  expect(q.sql).toContain("tenant_id"); expect(q.params).toContain("org-a");
});
