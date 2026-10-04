jest.mock("@/lib/repositories/acoesRepository", () => ({ findAcaoById: jest.fn(), findAllAcoesUpdates: jest.fn(), updateAcaoById: jest.fn() }));
jest.mock("@/lib/repositories/exepedicoesRepository", () => ({}));
jest.mock("@/lib/supabase/admin", () => ({}));
import { getAcaoDossie, updateAcaoFieldsById } from "../acoesService";
import { findAcaoById, findAllAcoesUpdates, updateAcaoById } from "@/lib/repositories/acoesRepository";
beforeEach(() => jest.resetAllMocks());
test("unauthorized action does not read history", async () => {
  (findAcaoById as jest.Mock).mockResolvedValue(undefined);
  await expect(getAcaoDossie(7, "org-a", [11])).rejects.toThrow();
  expect(findAcaoById).toHaveBeenCalledWith(7, "org-a", [11]);
  expect(findAllAcoesUpdates).not.toHaveBeenCalled();
});
test("editing action cannot move tenant, region or primary key through form fields", async () => {
  const form = new FormData();
  for (const [key, value] of Object.entries({ name: "New name", tenantId: "org-b", tenant_id: "org-b", regiaoId: "12", regiao_id: "12", id: "8", geom: "POINT(0 0)" })) form.set(key, value);
  await updateAcaoFieldsById(7, form, "org-a");
  expect(updateAcaoById).toHaveBeenCalledWith(7, { name: "New name" }, "org-a");
});
