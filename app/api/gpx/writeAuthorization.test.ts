jest.mock("@/lib/service/estradaService", () => ({ createEstradaData: jest.fn() }));
jest.mock("@/lib/repositories/estradasRepository", () => ({ findAllEstradasData: jest.fn() }));
jest.mock("@/lib/supabase/server", () => ({ createClient: jest.fn() }));
jest.mock("@/db", () => ({ db: { execute: jest.fn(), select: jest.fn() }, sql: jest.requireActual("drizzle-orm").sql }));
jest.mock("@/lib/service/acoesService", () => ({ createAcoesWithTrilha: jest.fn(), getAllAcoesData: jest.fn(), getAllAcoesForMap: jest.fn(), getAcaoDossie: jest.fn(), updateAcaoFieldsById: jest.fn() }));
jest.mock("@/lib/service/gpxImportService", () => ({ importGpx: jest.fn() }));
jest.mock("next/cache", () => ({ revalidatePath: jest.fn(), revalidateTag: jest.fn() }));
import { GET as getAcao, PUT as putAcao } from "../acoes/[id]/route";
import { GET as listAcoes } from "../acoes/route";
import { GET as roads, POST as createRoad } from "../estradas/route";
import { createEstradaData } from "@/lib/service/estradaService";
import { findAllEstradasData } from "@/lib/repositories/estradasRepository";
import { POST as acoes } from "../acoes/route";
import { POST as gpx } from "./route";
import { POST as gpxImport } from "./import/route";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { PgDialect } from "drizzle-orm/pg-core";
import { getAllAcoesData, getAllAcoesForMap, getAcaoDossie, updateAcaoFieldsById, createAcoesWithTrilha } from "@/lib/service/acoesService";
import { importGpx } from "@/lib/service/gpxImportService";
let role = "editor";
let authenticated = true;
let superadmin = false;
let defaultRegion: number | null = 11;
const statements: ReturnType<PgDialect["sqlToQuery"]>[] = [];
function request(kind: string, region = 11) {
  const form = new FormData();
  form.set("regiaoId", String(region));
  form.set("tenantId", "org-injected");
  if (kind === "acoes") {
    form.set("trilha", JSON.stringify({ nome: "Test trail", geom: "MULTILINESTRING Z ((0 0 0,1 1 0))" }));
    form.set("waypoints", JSON.stringify([{ latitude: 0, longitude: 0, mes: "janeiro", atuacao: "Teste", tenantId: "org-injected" }]));
  } else if (kind === "gpx") {
    form.set("file", new File(['<gpx version="1.1" creator="test"><trk><trkseg><trkpt lat="0" lon="0"/><trkpt lat="1" lon="1"/></trkseg></trk><wpt lat="0" lon="0"><name>Test</name></wpt></gpx>'], "test.gpx"));
  } else {
    form.set("acoes", JSON.stringify([{ nome: "Teste", acao: "Teste", categoria: "Monitoramento", tipo: "Teste", status: "Identificado", eixoTematico: "", tipoTecnico: "", carater: "", latitude: 0, longitude: 0, tenantId: "org-injected" }]));
  }
  return new Request("http://localhost/api/" + kind + "?tenantId=org-injected", { method: "POST", body: form, headers: { "x-tenant-id": "org-injected" } });
}
beforeEach(() => {
  jest.resetAllMocks(); role = "editor"; authenticated = true; superadmin = false; defaultRegion = 11; statements.length = 0;
  (createClient as jest.Mock).mockImplementation(async () => ({ auth: { getUser: async () => ({ data: { user: authenticated ? { id: "user-a", app_metadata: { tenant_id: "org-a", is_superadmin: superadmin } } : null }, error: null }) } }));
  (db.execute as jest.Mock).mockImplementation(async statement => {
    const q = new PgDialect().sqlToQuery(statement); statements.push(q);
    if (q.sql.includes("SELECT tenant_id::text")) return { rows: [{ tenant_id: "org-a" }] };
    if (q.sql.includes("SELECT region_id")) return { rows: defaultRegion == null ? [] : [{ region_id: defaultRegion }] };
    if (q.sql.includes("SELECT regiao_id")) return { rows: [] };
    if (q.sql.includes("FROM monitoramento.regioes")) return { rows: [{ tenant_id: q.params[0] === 22 ? "org-b" : "org-a" }] };
    if (q.sql.includes("SELECT EXISTS") && q.sql.includes("AS ok") && q.params.length === 2) return { rows: [{ ok: role === "owner" }] };
    if (q.sql.includes('FROM "monitoramento"."acoes" a')) return { rows: q.params[0] === 22 ? [] : [{ id: q.params[0], regiao_id: q.params[0] === 12 ? 12 : 11 }] };
    if (q.sql.includes("SELECT EXISTS")) {
      expect(q.params.slice(0, 2)).toEqual(["user-a", "org-a"]);
      expect(q.sql).toContain("role = 'owner'"); expect(q.sql).toContain("role = 'editor'");
      expect(q.sql).toContain("region_id =");
      return { rows: [{ ok: role === "owner" || (role === "editor" && q.params[2] === 11) }] };
    }
    return { rows: [{ id: 7 }] };
  });
  (db.select as jest.Mock).mockReturnValue({ from: () => ({ where: (condition: any) => ({ limit: async () => {
    const q = new PgDialect().sqlToQuery(condition);
    return q.params.slice(2).includes(role) ? [{ id: 1 }] : [];
  } }) }) });
  (createEstradaData as jest.Mock).mockResolvedValue({ id: 1 });
  (findAllEstradasData as jest.Mock).mockResolvedValue([]);
  (createAcoesWithTrilha as jest.Mock).mockResolvedValue({ id: 1 });
  (getAllAcoesData as jest.Mock).mockResolvedValue([]);
  (getAllAcoesForMap as jest.Mock).mockResolvedValue([]);
  (getAcaoDossie as jest.Mock).mockImplementation(async (id, _tenant, regions) => (regions === null || regions.includes(id)) && id !== 22 ? { id } : null);
  (updateAcaoFieldsById as jest.Mock).mockResolvedValue({ success: true });
  (importGpx as jest.Mock).mockResolvedValue({ acoesIds: [1], totalFotos: 0 });
});
describe.each([["acoes", acoes], ["gpx", gpx], ["gpx/import", gpxImport]] as const)("POST %s", (kind, handler) => {
  test("anonymous is rejected before body parsing or mutation", async () => {
    authenticated = false;
    expect((await handler(new Request("http://localhost/test", { method: "POST" }))).status).toBe(401);
    expect(db.execute).not.toHaveBeenCalled();
  });
  test.each(["viewer", "auditor"])("%s cannot write", async selected => {
    role = selected; expect((await handler(request(kind))).status).toBe(403);
    expect(createAcoesWithTrilha).not.toHaveBeenCalled(); expect(importGpx).not.toHaveBeenCalled();
  });
  test("another organization is rejected", async () => {
    expect((await handler(request(kind, 22))).status).toBe(403);
    expect(createAcoesWithTrilha).not.toHaveBeenCalled(); expect(importGpx).not.toHaveBeenCalled();
    expect(statements.some(q => q.sql.includes("INSERT"))).toBe(false);
  });
  test("editor cannot write another region in the same organization", async () => {
    expect((await handler(request(kind, 12))).status).toBe(403);
    expect(createAcoesWithTrilha).not.toHaveBeenCalled(); expect(importGpx).not.toHaveBeenCalled();
    expect(statements.some(q => q.sql.includes("INSERT"))).toBe(false);
  });
  test.each(["editor", "owner"])("%s writes authorized region with server tenant", async selected => {
    role = selected; expect((await handler(request(kind))).status).toBe(kind === "gpx" ? 200 : 201);
    if (kind === "acoes") expect(createAcoesWithTrilha).toHaveBeenCalledWith(expect.objectContaining({ tenantId: "org-a", regiaoId: 11 }));
    else if (kind === "gpx/import") expect(importGpx).toHaveBeenCalledWith(expect.objectContaining({ tenantId: "org-a", regiaoId: 11 }));
    else for (const q of statements.filter(q => q.sql.includes("INSERT"))) {
      expect(q.params).toContain("org-a"); expect(q.params).toContain(11); expect(q.params).not.toContain("org-injected");
    }
  });
  test("superadmin explicitly imports into the chosen region's organization", async () => {
    superadmin = true; expect((await handler(request(kind, 22))).status).toBe(kind === "gpx" ? 200 : 201);
    if (kind === "acoes") expect(createAcoesWithTrilha).toHaveBeenCalledWith(expect.objectContaining({ tenantId: "org-b", regiaoId: 22 }));
    else if (kind === "gpx/import") expect(importGpx).toHaveBeenCalledWith(expect.objectContaining({ tenantId: "org-b", regiaoId: 22 }));
    else expect(statements.filter(q => q.sql.includes("INSERT")).every(q => q.params.includes("org-b"))).toBe(true);
  });
});
test.each([["acoes", acoes], ["gpx", gpx]] as const)("%s without assigned default region fails closed", async (kind, handler) => {
  defaultRegion = null;
  const req = request(kind); const form = await req.formData(); form.delete("regiaoId");
  expect((await handler(new Request("http://localhost/test", { method: "POST", body: form }))).status).toBe(403);
});

const context = (id: number) => ({ params: Promise.resolve({ id: String(id) }) });
const readRequest = () => new Request("http://localhost/api/acoes/11");
const editRequest = () => { const form = new FormData(); form.set("status", "Identificado"); return new Request("http://localhost/api/acoes/11", { method: "PUT", body: form }); };
test.each([getAcao, putAcao])("action detail denies anonymous sessions", async handler => {
  authenticated = false; expect((await handler(editRequest(), context(11))).status).toBe(401);
});
test.each(["viewer", "auditor"])("%s cannot edit action", async selected => {
  role = selected; expect((await putAcao(editRequest(), context(11))).status).toBe(403);
  expect(updateAcaoFieldsById).not.toHaveBeenCalled();
});
test("editor cannot edit an action in another granted-read-only region", async () => {
  expect((await putAcao(editRequest(), context(12))).status).toBe(403);
  expect(updateAcaoFieldsById).not.toHaveBeenCalled();
});
test("foreign organization action is hidden and cannot be edited", async () => {
  expect((await getAcao(readRequest(), context(22))).status).toBe(404);
  expect((await putAcao(editRequest(), context(22))).status).toBe(404);
  expect(updateAcaoFieldsById).not.toHaveBeenCalled();
});
test("action GET carries assigned regions and hides another region", async () => {
  role = "viewer";
  expect((await getAcao(readRequest(), context(11))).status).toBe(200);
  expect(getAcaoDossie).toHaveBeenCalledWith(11, "org-a", [11]);
  expect((await getAcao(readRequest(), context(12))).status).toBe(404);
});
test("editor updates authorized action", async () => {
  expect((await putAcao(editRequest(), context(11))).status).toBe(200);
  expect(updateAcaoFieldsById).toHaveBeenCalledWith(11, expect.any(FormData), "org-a");
});
test.each(["dashboard", "map"])("action %s listing passes regional grants", async view => {
  role = "viewer";
  expect((await listAcoes(new Request("http://localhost/api/acoes?view=" + view))).status).toBe(200);
  expect(view === "dashboard" ? getAllAcoesData : getAllAcoesForMap).toHaveBeenCalledWith("org-a", [11]);
});

const roadRequest = (regiaoId = 11) => new Request("http://localhost/api/estradas", { method: "POST", body: JSON.stringify({ nome: "Road", regiaoId, tenantId: "org-injected" }) });
test("road listing carries regional grants", async () => {
  expect((await roads()).status).toBe(200);
  expect(findAllEstradasData).toHaveBeenCalledWith("org-a", false, [11]);
});
test.each([12, 22])("road creation rejects unauthorized region %s", async regionId => {
  expect((await createRoad(roadRequest(regionId))).status).toBe(403);
  expect(createEstradaData).not.toHaveBeenCalled();
});
test("road creation ignores forged tenant and uses authorized region", async () => {
  expect((await createRoad(roadRequest())).status).toBe(201);
  expect(createEstradaData).toHaveBeenCalledWith(expect.any(Object), "org-a", 11);
});
