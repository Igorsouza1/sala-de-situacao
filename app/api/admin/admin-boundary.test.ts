import * as organizations from "./organizations/route";
import * as organizationById from "./organizations/[id]/route";
import * as regions from "./regions/route";
import * as regionById from "./regions/[id]/route";
import * as commitLayer from "./regions/[id]/commit-layer/route";
import * as layerCatalog from "./layer-catalog/route";
import * as layerCatalogBySlug from "./layer-catalog/[slug]/route";
import * as users from "./users/route";
import * as userByRole from "./users/[roleId]/route";
import * as resendInvite from "./users/[roleId]/resend/route";
import * as userAccount from "./users/account/[userId]/route";
import * as propertyById from "./properties/[id]/route";
import * as layerById from "./layers/[id]/route";
import * as layerVisual from "./layers/[id]/visual/route";
import * as regionAcoes from "./regions/[id]/acoes/route";
import * as commitDesmatamento from "./regions/[id]/commit-desmatamento/route";
import * as commitFocos from "./regions/[id]/commit-focos/route";
import * as commitProperties from "./regions/[id]/commit-properties/route";
import * as commitUnion from "./regions/[id]/commit-union/route";
import * as previewUnion from "./regions/preview-union/route";
import { requireRole, requireSuperadmin } from "@/lib/api/require-auth";
import * as adminService from "@/lib/service/adminService";
import { db } from "@/db";

jest.mock("@/lib/api/require-auth", () => ({ requireRole: jest.fn(), requireSuperadmin: jest.fn() }));
jest.mock("@/lib/service/adminService", () => ({
  listOrganizations: jest.fn(), createOrganization: jest.fn(), updateOrganization: jest.fn(), deleteOrganization: jest.fn(),
  listRegions: jest.fn(), createRegion: jest.fn(), updateRegion: jest.fn(), deleteRegion: jest.fn(),
}));
jest.mock("@/db", () => ({ db: { select: jest.fn(), insert: jest.fn(), update: jest.fn(), delete: jest.fn(), execute: jest.fn(), transaction: jest.fn() } }));
jest.mock("@/lib/api/scope", () => ({ getTenantIdForRegion: jest.fn() }));
jest.mock("next/cache", () => ({ revalidateTag: jest.fn() }));

const request = (method: string) => new Request("http://localhost/api/admin/test", { method });
const context = { params: Promise.resolve({ id: "7" }) };
const organizationContext = { params: Promise.resolve({ id: "123e4567-e89b-12d3-a456-426614174000" }) };
const slugContext = { params: Promise.resolve({ slug: "layer-a" }) };
const roleContext = { params: Promise.resolve({ roleId: "7" }) };
const accountContext = { params: Promise.resolve({ userId: "123e4567-e89b-12d3-a456-426614174000" }) };

const routes = [
  ["organizations GET", () => organizations.GET()],
  ["organizations POST", () => organizations.POST(request("POST"))],
  ["organizations PUT", () => organizationById.PUT(request("PUT"), organizationContext)],
  ["organizations DELETE", () => organizationById.DELETE(request("DELETE"), organizationContext)],
  ["regions GET", () => regions.GET()],
  ["regions POST", () => regions.POST(request("POST"))],
  ["regions PUT", () => regionById.PUT(request("PUT"), context)],
  ["regions DELETE", () => regionById.DELETE(request("DELETE"), context)],
  ["region layer import POST", () => commitLayer.POST(request("POST"), context)],
  ["layer catalog GET", () => layerCatalog.GET()],
  ["layer catalog POST", () => layerCatalog.POST(request("POST") as never)],
  ["layer catalog PUT", () => layerCatalogBySlug.PUT(request("PUT") as never, slugContext)],
  ["layer catalog DELETE", () => layerCatalogBySlug.DELETE(request("DELETE") as never, slugContext)],
  ["users GET", () => users.GET()],
  ["users POST", () => users.POST(request("POST"))],
  ["user role PATCH", () => userByRole.PATCH(request("PATCH"), roleContext)],
  ["user role DELETE", () => userByRole.DELETE(request("DELETE"), roleContext)],
  ["user resend POST", () => resendInvite.POST(request("POST"), roleContext)],
  ["user account DELETE", () => userAccount.DELETE(request("DELETE"), accountContext)],
  ["property PATCH", () => propertyById.PATCH(request("PATCH"), context)],
  ["layer DELETE", () => layerById.DELETE(request("DELETE"), context)],
  ["layer visual PUT", () => layerVisual.PUT(request("PUT"), context)],
  ["region actions GET", () => regionAcoes.GET(request("GET"), context)],
  ["region actions POST", () => regionAcoes.POST(request("POST"), context)],
  ["desmatamento import POST", () => commitDesmatamento.POST(request("POST"), context)],
  ["focos import POST", () => commitFocos.POST(request("POST"), context)],
  ["properties import POST", () => commitProperties.POST(request("POST"), context)],
  ["region union POST", () => commitUnion.POST(request("POST"), context)],
  ["region union preview POST", () => previewUnion.POST(request("POST"))],
] as const;

beforeEach(() => {
  jest.clearAllMocks();
});

describe.each([401, 403])("admin boundary returns %i before touching data", (status) => {
  test.each(routes)("%s", async (_label, invoke) => {
    const denied = new Response(null, { status });
    jest.mocked(requireSuperadmin).mockResolvedValue({ response: denied } as never);
    jest.mocked(requireRole).mockResolvedValue({ response: denied } as never);

    expect((await invoke()).status).toBe(status);
    expect(jest.mocked(requireSuperadmin).mock.calls.length + jest.mocked(requireRole).mock.calls.length).toBe(1);
    if (jest.mocked(requireRole).mock.calls.length) expect(requireRole).toHaveBeenCalledWith("superadmin");
    for (const operation of [
      adminService.listOrganizations, adminService.createOrganization, adminService.updateOrganization,
      adminService.deleteOrganization, adminService.listRegions, adminService.createRegion,
      adminService.updateRegion, adminService.deleteRegion,
    ]) expect(operation).not.toHaveBeenCalled();
    expect(db.select).not.toHaveBeenCalled();
    expect(db.transaction).not.toHaveBeenCalled();
  });
});

it("allows a superadmin to list global organizations and regions", async () => {
  jest.mocked(requireSuperadmin).mockResolvedValue({ response: null } as never);
  jest.mocked(adminService.listOrganizations).mockResolvedValue([{ id: "org-a" }] as never);
  jest.mocked(adminService.listRegions).mockResolvedValue([{ id: 7 }] as never);

  expect((await organizations.GET()).status).toBe(200);
  expect((await regions.GET()).status).toBe(200);
  expect(adminService.listOrganizations).toHaveBeenCalledTimes(1);
  expect(adminService.listRegions).toHaveBeenCalledTimes(1);
});

it.each(["0", "-1", "7abc", "07", "1.2", "9007199254740992"])("rejects malformed region ID %s", async (id) => {
  jest.mocked(requireSuperadmin).mockResolvedValue({ response: null } as never);
  const response = await regionById.DELETE(request("DELETE"), { params: Promise.resolve({ id }) });
  expect(response.status).toBe(400);
  expect(adminService.deleteRegion).not.toHaveBeenCalled();
});

it.each([
  ["layer", commitLayer.POST],
  ["desmatamento", commitDesmatamento.POST],
  ["focos", commitFocos.POST],
  ["properties", commitProperties.POST],
  ["union", commitUnion.POST],
])("rejects a partial region ID before %s import", async (_label, handler) => {
  jest.mocked(requireSuperadmin).mockResolvedValue({ response: null } as never);
  jest.mocked(requireRole).mockResolvedValue({ response: null } as never);
  const response = await handler(request("POST"), { params: Promise.resolve({ id: "7abc" }) });
  expect(response.status).toBe(400);
  expect(db.execute).not.toHaveBeenCalled();
  expect(db.transaction).not.toHaveBeenCalled();
});
