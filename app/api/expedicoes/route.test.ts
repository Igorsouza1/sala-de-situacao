import { GET } from "./route";
import { requireAuthWithTenant } from "@/lib/api/require-auth";
import { getAccessibleRegionIdsForUser } from "@/lib/api/require-region";
import { getAllExpedicoesData } from "@/lib/service/expedicoesService";

jest.mock("@/lib/api/require-auth", () => ({ requireAuthWithTenant: jest.fn() }));
jest.mock("@/lib/api/require-region", () => ({ getAccessibleRegionIdsForUser: jest.fn() }));
jest.mock("@/lib/service/expedicoesService", () => ({ getAllExpedicoesData: jest.fn() }));

beforeEach(() => jest.clearAllMocks());

test("denies anonymous requests before querying expeditions", async () => {
  (requireAuthWithTenant as jest.Mock).mockResolvedValue({
    user: null,
    tenantId: null,
    response: new Response(null, { status: 401 }),
  });

  const response = await GET();

  expect(response.status).toBe(401);
  expect(getAccessibleRegionIdsForUser).not.toHaveBeenCalled();
  expect(getAllExpedicoesData).not.toHaveBeenCalled();
});

test("passes the user's tenant and region scope to the data query", async () => {
  (requireAuthWithTenant as jest.Mock).mockResolvedValue({
    user: { id: "user-a", app_metadata: {} },
    tenantId: "org-a",
    response: null,
  });
  (getAccessibleRegionIdsForUser as jest.Mock).mockResolvedValue([7, 9]);
  (getAllExpedicoesData as jest.Mock).mockResolvedValue({ trilhas: [], waypoints: [] });

  const response = await GET();

  expect(response.status).toBe(200);
  expect(getAccessibleRegionIdsForUser).toHaveBeenCalledWith("user-a", "org-a", false);
  expect(getAllExpedicoesData).toHaveBeenCalledWith("org-a", false, [7, 9]);
});
