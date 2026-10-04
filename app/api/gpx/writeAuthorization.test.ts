jest.mock("@/lib/supabase/server", () => ({ createClient: jest.fn() }));
jest.mock("@/db", () => ({ db: { execute: jest.fn(), select: jest.fn() }, sql: jest.requireActual("drizzle-orm").sql }));
jest.mock("@/lib/service/acoesService", () => ({ createAcoesWithTrilha: jest.fn(), getAllAcoesData: jest.fn(), getAllAcoesForMap: jest.fn() }));
jest.mock("@/lib/service/gpxImportService", () => ({ importGpx: jest.fn() }));
jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));
import { POST as acoes } from "../acoes/route";
import { POST as gpx } from "./route";
import { POST as gpxImport } from "./import/route";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { PgDialect } from "drizzle-orm/pg-core";
import { createAcoesWithTrilha } from "@/lib/service/acoesService";
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
  (createAcoesWithTrilha as jest.Mock).mockResolvedValue({ id: 1 });
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
