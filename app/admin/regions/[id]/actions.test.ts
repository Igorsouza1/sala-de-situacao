import { saveRegionMetadata } from "./actions";
import { requireSuperadmin } from "@/lib/api/require-auth";
import { updateRegionMetadata } from "@/lib/service/adminService";
import { revalidatePath } from "next/cache";

jest.mock("@/lib/api/require-auth", () => ({ requireSuperadmin: jest.fn() }));
jest.mock("@/lib/service/adminService", () => ({ updateRegionMetadata: jest.fn() }));
jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));

const data = { nome: "Regiao A", organizationId: "123e4567-e89b-12d3-a456-426614174000" };

beforeEach(() => jest.clearAllMocks());

it.each([401, 403])("denies server action with %i and never writes", async (status) => {
  jest.mocked(requireSuperadmin).mockResolvedValue({ response: new Response(null, { status }) } as never);
  await expect(saveRegionMetadata(7, data)).rejects.toThrow("Acesso negado");
  expect(updateRegionMetadata).not.toHaveBeenCalled();
  expect(revalidatePath).not.toHaveBeenCalled();
});

it("rejects malformed arguments even for superadmin", async () => {
  jest.mocked(requireSuperadmin).mockResolvedValue({ response: null } as never);
  await expect(saveRegionMetadata(0, data)).rejects.toThrow();
  await expect(saveRegionMetadata(7, { ...data, organizationId: "other" })).rejects.toThrow();
  expect(updateRegionMetadata).not.toHaveBeenCalled();
});

it("updates and revalidates for a superadmin", async () => {
  jest.mocked(requireSuperadmin).mockResolvedValue({ response: null } as never);
  await expect(saveRegionMetadata(7, data)).resolves.toEqual({ success: true });
  expect(updateRegionMetadata).toHaveBeenCalledWith(7, data);
  expect(revalidatePath).toHaveBeenCalledWith("/admin/regions/7");
});
