jest.mock("@/db", () => ({ db: { transaction: jest.fn() } }));
import { db } from "@/db";
import { PgDialect } from "drizzle-orm/pg-core";
import { deleteRoleAssignmentInDb } from "../userManagementRepository";

const execute = jest.fn();
const returning = jest.fn();
beforeEach(() => {
  jest.resetAllMocks();
  execute.mockResolvedValue({ rows: [] });
  execute.mockResolvedValueOnce({ rows: [{ user_id: "user-a", tenant_id: "org-a" }] });
  returning.mockResolvedValue([{ id: 4 }]);
  (db.transaction as jest.Mock).mockImplementation(callback => callback({
    execute, delete: () => ({ where: () => ({ returning }) }),
  }));
});
test("revocation serializes concurrent removals and conditionally removes only that organization's legacy access", async () => {
  expect(await deleteRoleAssignmentInDb(4)).toEqual({ id: 4 });
  expect(db.transaction).toHaveBeenCalledTimes(1);
  const statements = execute.mock.calls.map(([statement]) => new PgDialect().sqlToQuery(statement));
  expect(statements[0].params).toEqual([4]);
  expect(statements[1].sql).toContain("pg_advisory_xact_lock");
  expect(statements[1].params).toEqual(["user-a:org-a"]);
  expect(statements[2].sql).toContain("DELETE FROM monitoramento.user_access");
  expect(statements[2].sql).toContain("AND NOT EXISTS");
  expect(statements[2].sql).toContain("FROM monitoramento.roles");
  expect(statements[2].params).toEqual(["user-a", "org-a", "user-a", "org-a"]);
});
test("missing assignment never modifies legacy access", async () => {
  execute.mockReset().mockResolvedValue({ rows: [] });
  expect(await deleteRoleAssignmentInDb(404)).toBeNull();
  expect(execute).toHaveBeenCalledTimes(1);
  expect(returning).not.toHaveBeenCalled();
});
test("assignment removed concurrently never deletes a surviving legacy grant", async () => {
  returning.mockResolvedValue([]);
  expect(await deleteRoleAssignmentInDb(4)).toBeNull();
  expect(execute).toHaveBeenCalledTimes(2);
});
test("legacy cleanup failure rejects transaction instead of reporting successful revocation", async () => {
  execute.mockRejectedValueOnce(new Error("cleanup failed"));
  await expect(deleteRoleAssignmentInDb(4)).rejects.toThrow("cleanup failed");
});
