import { POST as uploadGpx } from "./route";
import { POST as processGpx } from "./process/route";
import { POST as importGpxRoute } from "./import/route";
import { GET as getEstradas, POST as postEstrada } from "../estradas/route";
import { GET as getExpedicoes } from "../expedicoes/route";
import { requireAuthWithTenant, requireRole } from "@/lib/api/require-auth";
import { getTenantIdForRegion } from "@/lib/api/scope";
import { getAccessibleRegionIdsForUser, getRegionIdForUser } from "@/lib/api/require-region";
import { createEstradaData } from "@/lib/service/estradaService";
import { findAllEstradasData } from "@/lib/repositories/estradasRepository";
import { getAllExpedicoesData } from "@/lib/service/expedicoesService";
import { importGpx } from "@/lib/service/gpxImportService";
import { gpxImportRequestSchema } from "@/lib/validators/gpx-import";
import { apiError } from "@/lib/api/responses";

jest.mock("@/db", () => ({ db: { execute: jest.fn() }, sql: jest.requireActual("drizzle-orm").sql }));
jest.mock("@/lib/api/require-auth", () => ({ requireAuthWithTenant: jest.fn(), requireRole: jest.fn() }));
jest.mock("@/lib/api/scope", () => ({ getTenantIdForRegion: jest.fn() }));
jest.mock("@/lib/api/require-region", () => ({ getRegionIdForUser: jest.fn(), getAccessibleRegionIdsForUser: jest.fn() }));
jest.mock("@/lib/service/estradaService", () => ({ createEstradaData: jest.fn() }));
jest.mock("@/lib/repositories/estradasRepository", () => ({ findAllEstradasData: jest.fn() }));
jest.mock("@/lib/service/expedicoesService", () => ({ getAllExpedicoesData: jest.fn() }));
jest.mock("@/lib/service/gpxImportService", () => ({ importGpx: jest.fn() }));
jest.mock("@/lib/validators/gpx-import", () => ({ gpxImportRequestSchema: { safeParse: jest.fn() } }));
jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));

const orgA = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const orgB = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const user = { id: "user-a", app_metadata: { tenant_id: orgA } };

function formRequest() {
  const form = new FormData();
  form.set("regiaoId", "12");
  form.set("acoes", "[]");
  return new Request("http://localhost/api/gpx/import", { method: "POST", body: form });
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(requireRole).mockResolvedValue({ user, tenantId: orgA, response: null } as any);
  jest.mocked(requireAuthWithTenant).mockResolvedValue({ user, tenantId: orgA, response: null } as any);
  jest.mocked(getTenantIdForRegion).mockResolvedValue(orgA);
  jest.mocked(getRegionIdForUser).mockResolvedValue(12);
  jest.mocked(getAccessibleRegionIdsForUser).mockResolvedValue([12]);
  jest.mocked(createEstradaData).mockResolvedValue({ id: 1 });
  jest.mocked(findAllEstradasData).mockResolvedValue([]);
  jest.mocked(getAllExpedicoesData).mockResolvedValue({ trilhas: {}, waypoints: {} } as any);
  jest.mocked(importGpx).mockResolvedValue({ trilhaId: 1, acoesIds: [2], totalFotos: 0 });
  (gpxImportRequestSchema.safeParse as jest.Mock).mockReturnValue({ success: true, data: { regiaoId: 12, acoes: [] } });
});

test.each([401, 403])("escritas GPX/estrada recusam papel sem autorização (%s)", async status => {
  jest.mocked(requireRole).mockResolvedValue({ user: null, tenantId: null, response: apiError("Negado", status) } as any);
  expect((await uploadGpx(new Request("http://localhost/api/gpx", { method: "POST" }))).status).toBe(status);
  expect((await processGpx({} as any)).status).toBe(status);
  expect((await importGpxRoute(formRequest())).status).toBe(status);
  expect((await postEstrada(new Request("http://localhost/api/estradas", { method: "POST" }))).status).toBe(status);
  expect(createEstradaData).not.toHaveBeenCalled();
  expect(importGpx).not.toHaveBeenCalled();
});

test("leituras de estrada e expedição retornam 401 sem sessão", async () => {
  jest.mocked(requireAuthWithTenant).mockResolvedValue({ user: null, tenantId: null, response: apiError("Negado", 401) } as any);
  expect((await getEstradas()).status).toBe(401);
  expect((await getExpedicoes()).status).toBe(401);
  expect(findAllEstradasData).not.toHaveBeenCalled();
  expect(getAllExpedicoesData).not.toHaveBeenCalled();
});

test("leituras passam tenant da sessão aos serviços", async () => {
  expect((await getEstradas()).status).toBe(200);
  expect((await getExpedicoes()).status).toBe(200);
  expect(findAllEstradasData).toHaveBeenCalledWith(orgA, false);
  expect(getAllExpedicoesData).toHaveBeenCalledWith(orgA, false, [12]);
});

test("estrada nova recebe tenant e região da sessão", async () => {
  const request = new Request("http://localhost/api/estradas", { method: "POST", body: JSON.stringify({ nome: "Estrada" }) });
  expect((await postEstrada(request)).status).toBe(201);
  expect(createEstradaData).toHaveBeenCalledWith({ nome: "Estrada" }, orgA, 12);
});

test("importação de GPX recusa região de outra organização", async () => {
  jest.mocked(getTenantIdForRegion).mockResolvedValue(orgB);
  expect((await importGpxRoute(formRequest())).status).toBe(403);
  expect(importGpx).not.toHaveBeenCalled();
});

test("importação de GPX usa tenant da região autorizada", async () => {
  expect((await importGpxRoute(formRequest())).status).toBe(201);
  expect(importGpx).toHaveBeenCalledWith({ regiaoId: 12, tenantId: orgA, acoes: [] });
});
