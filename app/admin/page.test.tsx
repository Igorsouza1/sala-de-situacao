import AdminDashboardPage from "./page";
import { checkIsSuperadmin } from "@/lib/api/check-admin";
import { fetchAdminDashboardData } from "@/lib/service/organizationService";
import { redirect } from "next/navigation";

jest.mock("@/lib/api/check-admin", () => ({ checkIsSuperadmin: jest.fn() }));
jest.mock("@/lib/service/organizationService", () => ({ fetchAdminDashboardData: jest.fn() }));
jest.mock("next/navigation", () => ({ redirect: jest.fn(() => { throw new Error("redirect"); }) }));

beforeEach(() => jest.clearAllMocks());

it("does not query global admin data before verifying Superadmin", async () => {
  jest.mocked(checkIsSuperadmin).mockResolvedValue(false);
  await expect(AdminDashboardPage()).rejects.toThrow("redirect");
  expect(redirect).toHaveBeenCalledWith("/protected");
  expect(fetchAdminDashboardData).not.toHaveBeenCalled();
});

it("queries global admin data after Superadmin verification", async () => {
  jest.mocked(checkIsSuperadmin).mockResolvedValue(true);
  jest.mocked(fetchAdminDashboardData).mockResolvedValue([]);
  await expect(AdminDashboardPage()).resolves.toBeTruthy();
  expect(fetchAdminDashboardData).toHaveBeenCalledTimes(1);
});
