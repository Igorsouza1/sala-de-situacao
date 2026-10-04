import { db } from "@/db";
import { findAllExpedicoesData } from "../exepedicoesRepository";
import { findAllEstradasData } from "../estradasRepository";

jest.mock("@/db", () => {
  const { drizzle } = jest.requireActual("drizzle-orm/node-postgres");
  return { db: drizzle({ client: { query: jest.fn().mockResolvedValue({ rows: [] }) } }), sql: jest.requireActual("drizzle-orm").sql };
});

const query = db.$client.query as jest.Mock;
const orgA = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

beforeEach(() => jest.clearAllMocks());

test("trilhas e waypoints usam o tenant autenticado e vinculam ambos ao mesmo tenant", async () => {
  await findAllExpedicoesData(orgA);
  expect(query).toHaveBeenCalledTimes(2);
  for (const [statement, params] of query.mock.calls) {
    expect(statement.text).toContain("tenant_id = $1::uuid");
    expect(params).toContain(orgA);
    expect(statement.text).not.toContain(orgA);
  }
  expect(query.mock.calls[1][0].text).toContain("w.tenant_id = t.tenant_id");
});

test("leitura de expedições restringe trilhas e waypoints às regiões atribuídas", async () => {
  await findAllExpedicoesData(orgA, false, [7, 9]);
  expect(query).toHaveBeenCalledTimes(2);
  for (const [statement, params] of query.mock.calls) {
    expect(statement.text).toContain("regiao_id IN");
    expect(params).toContain(7);
    expect(params).toContain(9);
    expect(params).toContain(orgA);
  }
  expect(query.mock.calls[1][0].text).toContain("w.regiao_id IN");
  expect(query.mock.calls[1][0].text).toContain("t.regiao_id = w.regiao_id");
});

test("usuário sem regiões atribuídas não recebe expedições do tenant", async () => {
  await findAllExpedicoesData(orgA, false, []);
  expect(query).toHaveBeenCalledTimes(2);
  for (const [statement] of query.mock.calls) {
    expect(statement.text).toContain("AND FALSE");
  }
});

test("superadmin pode consultar globalmente sem filtro regional", async () => {
  await findAllExpedicoesData(orgA, true, [7]);
  expect(query).toHaveBeenCalledTimes(2);
  for (const [statement, params] of query.mock.calls) {
    expect(statement.text).not.toContain("regiao_id IN");
    expect(statement.text).not.toMatch(/WHERE\s+(?:w\.)?tenant_id\s*=/);
    expect(params).not.toContain(orgA);
    expect(params).not.toContain(7);
  }
});

test("estradas filtram por tenant; superadmin consulta globalmente", async () => {
  await findAllEstradasData(orgA);
  expect(query.mock.calls[0][0].text).toContain("tenant_id = $1::uuid");
  expect(query.mock.calls[0][1]).toContain(orgA);

  query.mockClear();
  await findAllEstradasData(orgA, true);
  expect(query.mock.calls[0][0].text).not.toContain("tenant_id =");
  expect(query.mock.calls[0][1]).not.toContain(orgA);
});

test("sem tenant explícito as leituras falham fechadas", async () => {
  await expect(findAllExpedicoesData("")).rejects.toThrow(/tenantId/);
  await expect(findAllEstradasData("")).rejects.toThrow(/tenantId/);
  expect(query).not.toHaveBeenCalled();
});
