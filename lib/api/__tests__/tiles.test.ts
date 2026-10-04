jest.mock("@/lib/api/scope", () => ({ resolveScope: jest.fn() }));
jest.mock("@/lib/api/require-region", () => ({ getRegionIdsForUser: jest.fn() }));
jest.mock("@/lib/repositories/layerRepository", () => ({ getLayerCatalog: jest.fn() }));
jest.mock("@/db", () => ({ db: { execute: jest.fn() } }));
import { GET } from "@/app/api/tiles/[slug]/[z]/[x]/[y]/route";
import { resolveScope } from "../scope";
import { getRegionIdsForUser } from "../require-region";
import { getLayerCatalog } from "@/lib/repositories/layerRepository";
import { db } from "@/db";
import { NextRequest } from "next/server";
import { PgDialect } from "drizzle-orm/pg-core";
const params = { params: Promise.resolve({ slug: "test", z: "3", x: "1", y: "2" }) };
const request = (query = "") => new NextRequest("http://localhost/api/tiles/test/3/1/2" + query);
function catalog(table = "raw_firms", tenantId: string | null = "org-a", scope = "tenant") {
  (getLayerCatalog as jest.Mock).mockResolvedValue({ tenantId, scope, schemaConfig: { tableName: table } });
}
function query() {
  const calls = (db.execute as jest.Mock).mock.calls;
  return new PgDialect().sqlToQuery(calls[calls.length - 1][0]);
}
beforeEach(() => {
  jest.clearAllMocks();
  (resolveScope as jest.Mock).mockResolvedValue({ user: { id: "u1", app_metadata: {} }, tenantId: "org-a", regiaoId: null, response: null });
  (getRegionIdsForUser as jest.Mock).mockResolvedValue([11]);
  (db.execute as jest.Mock).mockImplementation(async (statement) => {
    const q = new PgDialect().sqlToQuery(statement);
    return q.sql.includes("ST_AsMVT(tile") ? { rows: [{ st_asmvt: Buffer.from([1, 2, 3]) }] } : { rows: [{ ok: false }] };
  });
  catalog();
});
test("anonymous receives 401 without querying catalog or data", async () => {
  (resolveScope as jest.Mock).mockResolvedValue({ response: new Response(null, { status: 401 }) });
  expect((await GET(request(), params)).status).toBe(401);
  expect(getLayerCatalog).not.toHaveBeenCalled(); expect(db.execute).not.toHaveBeenCalled();
});
test("another organization's catalog receives 403 before data", async () => {
  catalog("acoes", "org-b"); expect((await GET(request(), params)).status).toBe(403);
  expect(db.execute).not.toHaveBeenCalled();
});
test.each(["raw_firms", "desmatamento"])("%s uses canonical junction and region ownership", async (table) => {
  catalog(table); const response = await GET(request(), params); const q = query();
  expect(response.status).toBe(200); expect(q.sql).toContain(table === "raw_firms" ? '"firms_regioes"' : '"desmatamento_regioes"');
  expect(q.sql).toContain("r.organization_id"); expect(q.params).toContain("org-a"); expect(q.params).toContain(11);
  expect(q.sql).not.toContain("t.tenant_id");
  expect([...new Uint8Array(await response.arrayBuffer())]).toEqual([1, 2, 3]);
  expect(response.headers.get("cache-control")).toBe("private, no-store");
});
test("properties use spatial region ownership, ignoring legacy tenant", async () => {
  catalog("propriedades"); await GET(request(), params); const q = query();
  expect(q.sql).toContain("ST_Intersects"); expect(q.sql).toContain("r.geom"); expect(q.sql).toContain("r.organization_id");
  expect(q.sql).not.toContain("t.tenant_id"); expect(q.params).toContain(11);
});
test("actions constrain both organization and assigned region", async () => {
  catalog("acoes"); await GET(request(), params); const q = query();
  expect(q.sql).toContain("t.tenant_id"); expect(q.sql).toContain("r.id = t.regiao_id"); expect(q.params).toContain("org-a"); expect(q.params).toContain(11);
});
test.each([["org-b", "global"], [null, "tenant"]])("global roads remain available despite legacy owner %s", async (tenant, scope) => {
  catalog("estradas", tenant, scope!); expect((await GET(request(), params)).status).toBe(200);
  expect(query().sql).not.toContain("tenant_id"); expect(query().params).not.toContain("org-a");
});
test("global catalog does not expose base data outside accessible regions", async () => {
  catalog("raw_firms", "org-b", "global"); await GET(request(), params);
  expect(query().sql).toContain('"firms_regioes"'); expect(query().params).toContain("org-a");
});
test("missing region grants generate a query matching no base data", async () => {
  (getRegionIdsForUser as jest.Mock).mockResolvedValue([]); await GET(request(), params);
  expect(query().sql).toContain("AND FALSE");
});
test("explicit unassigned region returns 403", async () => {
  expect((await GET(request("?regiao_id=22"), params)).status).toBe(403);
  expect(resolveScope).toHaveBeenCalledWith({ regiaoId: 22 });
  expect((db.execute as jest.Mock).mock.calls).toHaveLength(1);
});
test("explicit accessible region constrains junction query", async () => {
  await GET(request("?regiao_id=11"), params); expect(query().sql).toContain("r.id ="); expect(query().params).toContain(11);
});
test("empty tile returns valid 204 with no body", async () => {
  (db.execute as jest.Mock).mockResolvedValue({ rows: [] });
  const response = await GET(request(), params); expect(response.status).toBe(204); expect(await response.text()).toBe("");
});
test("coordinates reject numeric suffixes and out of bounds", async () => {
  const invalid = { params: Promise.resolve({ slug: "test", z: "3x", x: "1", y: "2" }) };
  expect((await GET(request(), invalid)).status).toBe(400);
  expect(getLayerCatalog).not.toHaveBeenCalled();
});
