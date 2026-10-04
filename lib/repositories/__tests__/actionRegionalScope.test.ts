jest.mock("@/db", () => ({ db: { execute: jest.fn(), select: jest.fn() }, sql: jest.requireActual("drizzle-orm").sql }));
import { db } from "@/db";
import { PgDialect } from "drizzle-orm/pg-core";
import { findAcaoById, findAllAcoesData, findAllAcoesDataWithGeometry } from "../acoesRepository";
import { findAllEstradasData } from "../estradasRepository";
const where = jest.fn();
beforeEach(() => {
  jest.resetAllMocks();
  (db.execute as jest.Mock).mockResolvedValue({ rows: [] });
  (db.select as jest.Mock).mockReturnValue({ from: () => ({ where: (predicate: any) => { where(predicate); return Promise.resolve([]); } }) });
});
function query() { return new PgDialect().sqlToQuery((db.execute as jest.Mock).mock.calls.at(-1)[0]); }
test.each([[11], [11, 12], []])("action dossier SQL preserves grants %j and tenant", async (...ids: any[]) => {
  // test.each spreads arrays; reconstruct the regional fixture.
  const regions = ids as number[];
  await findAcaoById(7, "org-a", regions);
  const q = query(); expect(q.params).toEqual([7, "org-a", ...regions]);
  expect(q.sql).toContain("a.tenant_id");
  expect(q.sql).toContain(regions.length ? "a.regiao_id IN" : "AND FALSE");
});
test("action dashboard filters assigned regions before aggregation", async () => {
  await findAllAcoesData("org-a", [11, 12]);
  const q = new PgDialect().sqlToQuery(where.mock.calls[0][0]);
  expect(q.params).toEqual(["org-a", 11, 12]); expect(q.sql).toContain('"regiao_id" in');
});
test("empty dashboard scope matches no actions", async () => {
  await findAllAcoesData("org-a", []);
  expect(new PgDialect().sqlToQuery(where.mock.calls[0][0]).sql).toContain("FALSE");
});
test("action map preserves both date bounds alongside regional grants", async () => {
  await findAllAcoesDataWithGeometry("org-a", new Date("2026-01-01"), new Date("2026-02-01"), [11, 12]);
  const q = query(); expect(q.sql).toContain("a.regiao_id IN"); expect(q.sql).toContain("a.time >="); expect(q.sql).toContain("a.time <=");
  expect(q.params).toEqual(["org-a", 11, 12, "2026-01-01T00:00:00.000Z", "2026-02-01T00:00:00.000Z"]);
});
test.each([{ grants: [11, 12] }, { grants: [] }])("operational roads filter regional scope $grants", async ({ grants }) => {
  await findAllEstradasData("org-a", false, grants);
  const q = query(); expect(q.params).toEqual(["org-a", ...grants]);
  expect(q.sql).toContain(grants.length ? "regiao_id IN" : "AND FALSE");
});
