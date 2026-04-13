/**
 * Testes para app/api/map/layers/route.ts — task 2.4
 *
 * Verifica que a rota:
 * - Retorna 401 quando não autenticado
 * - Retorna 401 quando usuário não tem sessão
 * - Chama getAllLayers com o tenantId correto quando autenticado
 */

jest.mock("@/lib/supabase/server", () => ({ createClient: jest.fn() }));
jest.mock("@/lib/feature-flags", () => ({ FEATURES: { MULTI_TENANT: false } }));
jest.mock("@/lib/service/layerService", () => ({
  getAllLayers: jest.fn().mockResolvedValue([]),
}));

import { createClient } from "@/lib/supabase/server";
import * as layerService from "@/lib/service/layerService";
import { GET } from "../route";
import { NextRequest } from "next/server";

const SEED = "seed-0000-0000-0000-000000000000";

function makeRequest(params: Record<string, string> = {}) {
  const url = new URL("http://localhost/api/map/layers");
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return new NextRequest(url);
}

function mockUser(user: any) {
  (createClient as jest.Mock).mockResolvedValue({
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user }, error: null }),
    },
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  process.env.SEED_TENANT_ID = SEED;
});

afterEach(() => {
  delete process.env.SEED_TENANT_ID;
});

describe("GET /api/map/layers", () => {
  it("retorna 401 quando não autenticado", async () => {
    mockUser(null);

    const res = await GET(makeRequest());

    expect(res.status).toBe(401);
    expect(layerService.getAllLayers).not.toHaveBeenCalled();
  });

  it("chama getAllLayers com SEED_TENANT_ID quando MULTI_TENANT=false", async () => {
    mockUser({ id: "u1", email: "a@b.com", app_metadata: {} });

    await GET(makeRequest());

    expect(layerService.getAllLayers).toHaveBeenCalled();
    const [tenantId] = (layerService.getAllLayers as jest.Mock).mock.calls[0];
    expect(tenantId).toBe(SEED);
  });

  it("passa startDate e endDate para getAllLayers", async () => {
    mockUser({ id: "u1", email: "a@b.com", app_metadata: {} });

    await GET(makeRequest({ startDate: "2024-01-01", endDate: "2024-12-31" }));

    const [, startDate, endDate] = (layerService.getAllLayers as jest.Mock).mock.calls[0];
    expect(startDate).toBeInstanceOf(Date);
    expect(endDate).toBeInstanceOf(Date);
  });
});
