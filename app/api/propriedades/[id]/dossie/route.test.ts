import { GET } from "./route";
import { requireAuthWithTenant } from "@/lib/api/require-auth";
import { getAccessibleRegionIdsForUser } from "@/lib/api/require-region";
import { findPropriedadeDossieData } from "@/lib/repositories/propriedadesRepository";
import { apiError } from "@/lib/api/responses";

jest.mock("@/lib/api/require-auth", () => ({ requireAuthWithTenant: jest.fn() }));
jest.mock("@/lib/api/require-region", () => ({ getAccessibleRegionIdsForUser: jest.fn() }));
jest.mock("@/lib/repositories/propriedadesRepository", () => ({ findPropriedadeDossieData: jest.fn() }));

const params = { params: Promise.resolve({ id: "5" }) };
const request = () => new Request("http://localhost/api/propriedades/5/dossie") as any;

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(requireAuthWithTenant).mockResolvedValue({
    user: { id: "user-a", app_metadata: { tenant_id: "org-a" } }, tenantId: "org-a", response: null,
  } as any);
  jest.mocked(getAccessibleRegionIdsForUser).mockResolvedValue([7, 8]);
  jest.mocked(findPropriedadeDossieData).mockResolvedValue({ id: 5 } as any);
});

test("sem sessão retorna 401", async () => {
  jest.mocked(requireAuthWithTenant).mockResolvedValue({ user: null, tenantId: null, response: apiError("Negado", 401) } as any);
  expect((await GET(request(), params)).status).toBe(401);
  expect(findPropriedadeDossieData).not.toHaveBeenCalled();
});

test("sem Regiões atribuídas retorna 404 antes da consulta", async () => {
  jest.mocked(getAccessibleRegionIdsForUser).mockResolvedValue([]);
  expect((await GET(request(), params)).status).toBe(404);
  expect(findPropriedadeDossieData).not.toHaveBeenCalled();
});

test("dossiê só consulta Regiões concedidas dentro da Organização", async () => {
  expect((await GET(request(), params)).status).toBe(200);
  expect(findPropriedadeDossieData).toHaveBeenCalledWith(5, "org-a", [7, 8]);
});

test("propriedade fora do escopo retorna 404", async () => {
  jest.mocked(findPropriedadeDossieData).mockResolvedValue(null as any);
  expect((await GET(request(), params)).status).toBe(404);
});
