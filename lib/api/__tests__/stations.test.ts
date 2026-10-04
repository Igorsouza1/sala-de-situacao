jest.mock("@/lib/supabase/server", () => ({ createClient: jest.fn() }));
jest.mock("@/db", () => ({ db: { execute: jest.fn(), select: jest.fn() } }));
jest.mock("@/lib/service/sheetSyncService", () => ({ syncBalnearioFromSheet: jest.fn().mockResolvedValue({ inserted: 1, updated: 0 }) }));
jest.mock("@/lib/service/balnearioService", () => ({getAllBalnearioDataGroupedByMonth: jest.fn().mockResolvedValue([]), getBalnearioDataByDateRange: jest.fn().mockResolvedValue([]), createBalnearioData: jest.fn().mockResolvedValue([]), getNivelAguaBalnearioIndicador: jest.fn().mockResolvedValue([]), getPluviometriaBalnearioIndicador: jest.fn().mockResolvedValue([]), getSecchiBalnearioIndicador: jest.fn().mockResolvedValue([]), getSecchiBalnearioHistorico: jest.fn().mockResolvedValue([]), getPluviometriaBalnearioHistorico: jest.fn().mockResolvedValue([]), getNivelRioBalnearioHistorico: jest.fn().mockResolvedValue([])}));
jest.mock("@/lib/service/dequeService", () => ({getAllDequeDataGroupedByMonth: jest.fn().mockResolvedValue([]), getDequeDataByDateRange: jest.fn().mockResolvedValue([]), createDequeData: jest.fn().mockResolvedValue([]), getchuvaComparativoPct: jest.fn().mockResolvedValue([]), getTurbidezDequeHistorico: jest.fn().mockResolvedValue([]), getSecchiDequeHistorico: jest.fn().mockResolvedValue([]), getPluviometriaDequeHistorico: jest.fn().mockResolvedValue([]), getTurbidezIndicador: jest.fn().mockResolvedValue([])}));
jest.mock("@/lib/service/ponteService", () => ({getAllPonteData: jest.fn().mockResolvedValue([]), getPonteDataByDateRange: jest.fn().mockResolvedValue([]), createPonteData: jest.fn().mockResolvedValue([]), getNivelRioComparativoPct: jest.fn().mockResolvedValue([])}));
import { PgDialect } from "drizzle-orm/pg-core";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { requireStationAccess } from "../station-access";
import { POST as sync } from "@/app/api/balneario-municipal/sync/route";
import { syncBalnearioFromSheet } from "@/lib/service/sheetSyncService";
import { GET as balneario } from "@/app/api/balneario-municipal/route";
import { getAllBalnearioDataGroupedByMonth } from "@/lib/service/balnearioService";
let currentTenant = "org-a";
let currentRole = "viewer";
function user(tenant = "org-a", superadmin = false) {
  currentTenant = tenant;
  (createClient as jest.Mock).mockResolvedValue({ auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: "u1", app_metadata: { tenant_id: tenant, is_superadmin: superadmin } } }, error: null }) } });
}
beforeEach(() => {
  jest.clearAllMocks(); currentTenant = "org-a"; currentRole = "viewer";
  delete process.env.BALNEARIO_TENANT_ID;
  delete process.env.DEQUE_TENANT_ID;
  delete process.env.PONTE_TENANT_ID;
  delete process.env.CRON_SECRET;
  (db.execute as jest.Mock).mockImplementation(async statement => {
    const q = new PgDialect().sqlToQuery(statement);
    return { rows: [{ tenant_id: q.sql.includes('monitoramento.roles') ? currentTenant : "org-a" }] };
  });
  (db.select as jest.Mock).mockReturnValue({ from: () => ({ where: (condition: any) => ({ limit: () => {
    const q = new PgDialect().sqlToQuery(condition);
    expect(q.params.slice(0, 2)).toEqual(["u1", currentTenant]);
    return Promise.resolve(q.params.slice(2).includes(currentRole) ? [{ id: 1 }] : []);
  } }) }) });
});
const routes = ["app/api/balneario-municipal/route", "app/api/balneario-municipal/daily/route", "app/api/balneario-municipal/historico/nivel-rio/route", "app/api/balneario-municipal/historico/pluviometria/route", "app/api/balneario-municipal/historico/secchi/route", "app/api/balneario-municipal/indicadores/nivel-agua/route", "app/api/balneario-municipal/indicadores/pluviometria/route", "app/api/balneario-municipal/indicadores/secchi/route", "app/api/balneario-municipal/sync/route", "app/api/deque-pedras/route", "app/api/deque-pedras/daily/route", "app/api/deque-pedras/historico/pluviometria/route", "app/api/deque-pedras/historico/secchi/route", "app/api/deque-pedras/historico/turbidez/route", "app/api/deque-pedras/indicadores/chuva/route", "app/api/deque-pedras/indicadores/turbidez/route", "app/api/ponte-cure/route", "app/api/ponte-cure/daily/route", "app/api/ponte-cure/indicador/nivel-rio/route"];
test.each(routes)("%s rejects unauthenticated requests", async (path) => {
  (createClient as jest.Mock).mockResolvedValue({ auth: { getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }) } });
  const route = require("@/" + path);
  const req = new Request("http://localhost/api/station");
  if (route.GET) expect((await route.GET(req)).status).toBe(401);
  if (route.POST) expect((await route.POST(req)).status).toBe(401);
});
test.each(["balneario-municipal", "deque-pedras", "ponte-cure"] as const)("%s rejects other organizations", async (station) => {
  user("org-b");
  expect((await requireStationAccess(station)).response?.status).toBe(403);
});
test("owner organization reads dashboard with its tenant", async () => {
  user();
  expect((await balneario()).status).toBe(200);
  expect(getAllBalnearioDataGroupedByMonth).toHaveBeenCalledWith("org-a");
});
test.each(["viewer", "auditor"])("%s cannot synchronize", async (role) => {
  user(); currentRole = role;
  expect((await sync(new Request("http://localhost/sync", { method: "POST" }))).status).toBe(403);
  expect(syncBalnearioFromSheet).not.toHaveBeenCalled();
});
test.each(["editor", "owner"])("%s can synchronize the owner station", async (role) => {
  user(); currentRole = role; process.env.BALNEARIO_TENANT_ID = "org-a";
  expect((await sync(new Request("http://localhost/sync", { method: "POST" }))).status).toBe(200);
});
test("configured cron secret can synchronize without session", async () => {
  process.env.CRON_SECRET = "cron-test";
  expect((await sync(new Request("http://localhost/sync", { headers: { authorization: "Bearer cron-test" } }))).status).toBe(200);
});
test("missing cron secret never permits a bearer bypass", async () => {
  (createClient as jest.Mock).mockResolvedValue({ auth: { getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }) } });
  expect((await sync(new Request("http://localhost/sync", { headers: { authorization: "Bearer undefined" } }))).status).toBe(401);
});
test("ambiguous ownership fails closed", async () => {
  user(); (db.execute as jest.Mock).mockResolvedValue({ rows: [{ tenant_id: "org-a" }, { tenant_id: "org-b" }] });
  expect((await requireStationAccess("deque-pedras")).response?.status).toBe(403);
});
test("superadmin uses station owner rather than active tenant", async () => {
  user("org-b", true);
  expect((await requireStationAccess("ponte-cure")).tenantId).toBe("org-a");
});

test.each(routes)("%s rejects another current organization before accessing service", async path => {
  user("org-b"); currentRole = "editor";
  const route = require("@/" + path);
  const req = new Request("http://localhost/api/station");
  if (route.GET) expect((await route.GET(req)).status).toBe(403);
  if (route.POST) expect((await route.POST(req)).status).toBe(403);
});
test.each(["balneario-municipal", "deque-pedras", "ponte-cure"] as const)("%s rejects revoked metadata session", async station => {
  user(); (db.execute as jest.Mock).mockResolvedValue({ rows: [] });
  expect((await requireStationAccess(station)).response?.status).toBe(403);
});
test.each(["balneario-municipal", "deque-pedras", "ponte-cure"] as const)("%s RBAC uses actual role predicate", async station => {
  user();
  for (const role of ["viewer", "auditor", "editor", "owner"]) {
    currentRole = role;
    const access = await requireStationAccess(station, true);
    expect(access.response?.status ?? 200).toBe(["editor", "owner"].includes(role) ? 200 : 403);
  }
});

test.each([
  ["balneario-municipal", "balnearioService", "createBalnearioData"],
  ["deque-pedras", "dequeService", "createDequeData"],
  ["ponte-cure", "ponteService", "createPonteData"],
])("%s writes using station owner despite forged request tenant", async (station, service, method) => {
  user(); currentRole = "editor";
  const handler = require("@/app/api/" + station + "/route").POST;
  const body = { tenantId: "org-b", tenant_id: "org-b", organizationId: "org-b", data: "2026-01-01" };
  const response = await handler(new Request("http://localhost/api/" + station + "?tenantId=org-b", {
    method: "POST", body: JSON.stringify(body), headers: { "x-tenant-id": "org-b" },
  }));
  expect(response.status).toBe(201);
  expect(require("@/lib/service/" + service)[method]).toHaveBeenCalledWith("org-a", body);
});
