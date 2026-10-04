jest.mock("@/db", () => ({ db: { select: jest.fn() } }));
import { db } from "@/db";
import { PgDialect } from "drizzle-orm/pg-core";
import { findAllBalnearioData, findBalnearioDataByDateRange } from "../balnearioRepository";
import { findAllDequeData, findDequeDataByDateRange } from "../dequeRepository";
import { findAllPonteData, findPonteDataByDateRange } from "../ponteRepository";
const where = jest.fn();
beforeEach(() => {
  jest.clearAllMocks();
  const chain: any = { from: () => chain, where: (q: any) => { where(q); return chain; }, orderBy: () => chain, execute: () => Promise.resolve([]), then: (resolve: any) => Promise.resolve([]).then(resolve) };
  (db.select as jest.Mock).mockReturnValue(chain);
});
test.each([findAllBalnearioData, findAllDequeData, findAllPonteData])("all readings are filtered before aggregation", async (find) => {
  await find("org-a");
  const q = new PgDialect().sqlToQuery(where.mock.calls[0][0]);
  expect(q.sql).toContain('"tenant_id" ='); expect(q.params).toEqual(["org-a"]);
});
test.each([findBalnearioDataByDateRange, findDequeDataByDateRange, findPonteDataByDateRange])("date ranges preserve tenant and both bounds", async (find) => {
  await find("org-a", "2026-01-01", "2026-02-01");
  expect(where).toHaveBeenCalledTimes(1);
  const q = new PgDialect().sqlToQuery(where.mock.calls[0][0]);
  expect(q.params).toEqual(["org-a", "2026-01-01", "2026-02-01"]);
  expect(q.sql).toContain('"tenant_id" ='); expect(q.sql).toContain(' >= '); expect(q.sql).toContain(' <= ');
});
