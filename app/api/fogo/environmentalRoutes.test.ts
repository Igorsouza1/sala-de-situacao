import { GET as fogo } from "./route";
import { GET as indicadorFogo } from "./indicador/route";
import { GET as desmatamento } from "../desmatamento/route";
import { GET as indicadorDesmatamento } from "../desmatamento/indicador/route";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { getAccessibleRegionIdsForUser, getRegionIdForUser } from "@/lib/api/require-region";
import { getAllFirmsData, getFocosIndicador } from "@/lib/service/firmsService";
import { getAllDesmatamentoDataGroupedByMonthAndYear } from "@/lib/service/desmatamentoService";

// resolveScope e requireAuthWithTenant são reais: a rota autentica sem middleware.
jest.mock("@/lib/supabase/server", () => ({ createClient: jest.fn() }));
jest.mock("@/db", () => ({ db: { execute: jest.fn() } }));
jest.mock("@/lib/api/require-region", () => ({ getRegionIdForUser: jest.fn(), getAccessibleRegionIdsForUser: jest.fn() }));
jest.mock("@/lib/service/firmsService", () => ({ getAllFirmsData: jest.fn(), getFocosIndicador: jest.fn() }));
jest.mock("@/lib/service/desmatamentoService", () => ({ getAllDesmatamentoDataGroupedByMonthAndYear: jest.fn() }));

const services = [getAllFirmsData, getFocosIndicador, getAllDesmatamentoDataGroupedByMonthAndYear];
const region = jest.mocked(getRegionIdForUser);
const accessibleRegions = jest.mocked(getAccessibleRegionIdsForUser);

function session(appMetadata: Record<string, unknown> | null) {
  (db.execute as jest.Mock).mockReset().mockResolvedValue({ rows: [] });
  if (appMetadata?.is_superadmin !== true) (db.execute as jest.Mock).mockResolvedValueOnce({ rows: appMetadata?.tenant_id ? [{ tenant_id: appMetadata.tenant_id }] : [] });
  (createClient as jest.Mock).mockResolvedValue({
    auth: { getUser: jest.fn().mockResolvedValue({ data: {
      user: appMetadata === null ? null : { id: "user-a", app_metadata: appMetadata },
    }, error: null }) },
  });
}

beforeEach(() => {
  jest.resetAllMocks();
  (db.execute as jest.Mock).mockResolvedValue({ rows: [] });
  session({ tenant_id: "org-a" });
  region.mockResolvedValue(11);
  accessibleRegions.mockResolvedValue(null);
  for (const service of services) (service as jest.Mock).mockResolvedValue({ 2026: Array(12).fill(0) });
});

describe.each([
  { path: "/api/fogo", handler: fogo, service: getAllFirmsData },
  { path: "/api/fogo/indicador", handler: indicadorFogo, service: getFocosIndicador },
  { path: "/api/desmatamento", handler: desmatamento, service: getAllDesmatamentoDataGroupedByMonthAndYear },
  { path: "/api/desmatamento/indicador", handler: indicadorDesmatamento, service: getAllDesmatamentoDataGroupedByMonthAndYear },
])("GET $path", ({ path, handler, service }) => {
  const request = (params = "") => new Request(`http://localhost${path}?${params}`);

  test("sem sessão retorna 401 diretamente, sem consultar serviços", async () => {
    session(null);
    const response = await handler(request());
    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({ success: false, data: null });
    for (const read of services) expect(read).not.toHaveBeenCalled();
    expect(region).not.toHaveBeenCalled();
  });

  test("sem Organização resolvível retorna 403, sem ampliar escopo", async () => {
    session({});
    expect((await handler(request())).status).toBe(403);
    expect(service).not.toHaveBeenCalled();
  });

  test.each(["org-a", "org-b"])("usa Organização da sessão %s e ignora tenant/privilégio do request", async tenantId => {
    session({ tenant_id: tenantId });
    const req = request("tenant_id=org-invasora&tenantId=org-invasora&organization_id=org-invasora&is_superadmin=true");
    req.headers.set("x-tenant-id", "org-invasora");
    const response = await handler(req);
    expect(response.status).toBe(200);
    expect(service).toHaveBeenCalledWith(tenantId, false, undefined);
    expect(accessibleRegions).toHaveBeenCalledWith("user-a", tenantId, false);
    expect(await response.json()).toEqual({ success: true, data: { 2026: Array(12).fill(0) }, error: null });
  });

  test("sem Região padrão continua consultando todas as Regiões da Organização", async () => {
    region.mockResolvedValue(null);
    expect((await handler(request())).status).toBe(200);
    expect(service).toHaveBeenCalledWith("org-a", false, undefined);
  });

  test("Região explícita autorizada restringe a consulta", async () => {
    (db.execute as jest.Mock).mockResolvedValue({ rows: [{ tenant_id: "org-a" }] });
    expect((await handler(request("regiao_id=12"))).status).toBe(200);
    expect(db.execute).toHaveBeenCalled();
    expect(service).toHaveBeenCalledWith("org-a", false, 12);
  });

  test("usuário com duas Regiões recebe apenas ambas as Regiões autorizadas", async () => {
    accessibleRegions.mockResolvedValue([11, 12]);
    expect((await handler(request())).status).toBe(200);
    expect(service).toHaveBeenCalledWith("org-a", false, [11, 12]);
  });

  test("Região explícita fora das atribuições é bloqueada mesmo dentro da Organização", async () => {
    accessibleRegions.mockResolvedValue([11]);
    (db.execute as jest.Mock).mockResolvedValue({ rows: [{ tenant_id: "org-a" }] });
    expect((await handler(request("regiao_id=12"))).status).toBe(403);
    expect(service).not.toHaveBeenCalled();
  });

  test("usuário sem Regiões atribuídas não consulta dados", async () => {
    accessibleRegions.mockResolvedValue([]);
    expect((await handler(request())).status).toBe(403);
    expect(service).not.toHaveBeenCalled();
  });

  test("Região de outra Organização retorna 403 antes da consulta", async () => {
    (db.execute as jest.Mock).mockResolvedValue({ rows: [{ tenant_id: "org-b" }] });
    expect((await handler(request("regiao_id=22"))).status).toBe(403);
    expect(service).not.toHaveBeenCalled();
  });

  test("Superadmin permanece global apesar da Região padrão", async () => {
    session({ tenant_id: "org-a", is_superadmin: true });
    expect((await handler(request())).status).toBe(200);
    expect(service).toHaveBeenCalledWith("org-a", true, undefined);
  });

  test("somente flag booleana verdadeira concede leitura global", async () => {
    session({ tenant_id: "org-a", is_superadmin: "true" });
    expect((await handler(request())).status).toBe(200);
    expect(service).toHaveBeenCalledWith("org-a", false, undefined);
  });

  test("Superadmin pode consultar uma Região explícita de outra Organização", async () => {
    session({ tenant_id: "org-a", is_superadmin: true });
    (db.execute as jest.Mock).mockResolvedValue({ rows: [{ tenant_id: "org-b" }] });
    expect((await handler(request("regiao_id=22"))).status).toBe(200);
    expect(service).toHaveBeenCalledWith("org-b", true, 22);
  });
});
