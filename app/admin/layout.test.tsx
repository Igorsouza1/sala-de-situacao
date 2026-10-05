import AdminLayout from "./layout";
import { checkIsSuperadmin } from "@/lib/api/check-admin";
import { redirect } from "next/navigation";

jest.mock("@/lib/api/check-admin", () => ({ checkIsSuperadmin: jest.fn() }));
jest.mock("next/navigation", () => ({ redirect: jest.fn(() => { throw new Error("redirect"); }) }));

beforeEach(() => jest.clearAllMocks());

it("redirects anyone without global Superadmin access before rendering admin children", async () => {
  jest.mocked(checkIsSuperadmin).mockResolvedValue(false);
  await expect(AdminLayout({ children: "secret admin content" })).rejects.toThrow("redirect");
  expect(redirect).toHaveBeenCalledWith("/protected");
});

it("renders admin children for a Superadmin", async () => {
  jest.mocked(checkIsSuperadmin).mockResolvedValue(true);
  const result = await AdminLayout({ children: "admin content" });
  expect(result.props.children).toBe("admin content");
  expect(redirect).not.toHaveBeenCalled();
});
