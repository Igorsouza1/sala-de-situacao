/**
 * Testes para tenant-context e feature-flags
 */
import { extractTenantId, requireTenantId } from "../tenant-context";
import type { User } from "@supabase/supabase-js";

function makeUser(appMeta: Record<string, any> = {}): User {
  return {
    id: "user-123",
    email: "user@test.com",
    app_metadata: appMeta,
    user_metadata: {},
    aud: "authenticated",
    created_at: new Date().toISOString(),
  } as unknown as User;
}

describe("extractTenantId", () => {
  it("retorna o tenant_id do app_metadata quando presente", () => {
    const user = makeUser({ tenant_id: "tenant-abc" });
    expect(extractTenantId(user)).toBe("tenant-abc");
  });

  it("retorna null quando app_metadata não tem tenant_id", () => {
    const user = makeUser({});
    expect(extractTenantId(user)).toBeNull();
  });

  it("retorna null quando app_metadata é undefined", () => {
    const user = { ...makeUser(), app_metadata: undefined } as unknown as User;
    expect(extractTenantId(user)).toBeNull();
  });
});

describe("requireTenantId", () => {
  it("retorna o tenantId quando presente", () => {
    const user = makeUser({ tenant_id: "tenant-xyz" });
    expect(requireTenantId(user)).toBe("tenant-xyz");
  });

  it("lança erro quando não há tenant_id", () => {
    const user = makeUser({});
    expect(() => requireTenantId(user)).toThrow("User has no tenant association");
  });
});
