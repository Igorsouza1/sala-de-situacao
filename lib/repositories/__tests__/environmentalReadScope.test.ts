import { db } from "@/db";
import { findAllFirmsData, firmsRepository } from "../firmsRepository";
import { findAllDesmatamentoData } from "../desmatamentoReposiroty";

// Compila as consultas reais com Drizzle; só o transporte PostgreSQL é mockado.
jest.mock("@/db", () => {
  const { drizzle } = jest.requireActual("drizzle-orm/node-postgres");
  return { db: drizzle({ client: { query: jest.fn().mockResolvedValue({ rows: [] }) } }) };
});

const query = db.$client.query as jest.Mock;
const orgA = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const orgB = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const start = "2026-08-01";
const end = "2026-08-31";

const readers = [
  { name: "Focos de Calor mensais", table: "raw_firms", junction: "firms_regioes", alias: "fr", fk: "firm_id", read: findAllFirmsData },
  { name: "indicador de Focos de Calor", table: "raw_firms", junction: "firms_regioes", alias: "fr", fk: "firm_id",
    read: (tenantId: string, superadmin: boolean, regiaoId?: number) => firmsRepository.getFirmsDataByDateRange(tenantId, superadmin, start, end, regiaoId) },
  { name: "Detecções de Desmatamento", table: "desmatamento", junction: "desmatamento_regioes", alias: "dr", fk: "desmatamento_id", read: findAllDesmatamentoData },
];

beforeEach(() => jest.clearAllMocks());

describe.each(readers)("$name", ({ table, junction, alias, fk, read }) => {
  test.each([orgA, orgB])("isola a Organização %s via EXISTS correlacionado, sem duplicar registros", async tenantId => {
    await read(tenantId, false);
    const [{ text }, params] = query.mock.calls[0];
    const sql = text.replace(/\s+/g, " ");
    expect(sql).toMatch(new RegExp(`EXISTS \\( SELECT 1 FROM monitoramento\\.${junction}`));
    expect(sql).toContain(`JOIN monitoramento.regioes r ON r.id = ${alias}.regiao_id`);
    expect(sql).toContain(`${alias}.${fk} = "monitoramento"."${table}"."id"`);
    expect(sql).toMatch(/r\.organization_id = \$\d+::uuid/);
    expect(params).toContain(tenantId);
    expect(params).not.toContain(tenantId === orgA ? orgB : orgA);
    expect(sql).not.toContain(tenantId);
    expect(sql).not.toContain("tenant_id");
    // Sem Região explícita, não limita à primeira Região do usuário.
    expect(sql).not.toMatch(/r\.id = \$\d+/);
    expect(sql).not.toMatch(new RegExp(`"${table}"\\."regiao_id"`));
    // Nenhum JOIN na consulta externa que multiplique contagens/hectares.
    expect(sql.split("EXISTS")[0]).not.toMatch(/\bjoin\b/i);
  });

  test("Região explícita mantém também o filtro de Organização", async () => {
    await read(orgA, false, 12);
    const [{ text }, params] = query.mock.calls[0];
    expect(text).toContain("r.organization_id =");
    expect(text).toMatch(/AND r\.id = \$\d+/);
    expect(params).toEqual(expect.arrayContaining([orgA, 12]));
  });

  test("Superadmin lê globalmente, inclusive Dados de Base sem associação", async () => {
    await read(orgA, true);
    const [{ text }, params] = query.mock.calls[0];
    expect(text).not.toMatch(/EXISTS|organization_id|regiao_id/);
    expect(params).not.toContain(orgA);
  });

  test("Superadmin pode filtrar uma Região sem restringir pela Organização", async () => {
    await read(orgA, true, 22);
    const [{ text }, params] = query.mock.calls[0];
    expect(text).toContain("EXISTS");
    expect(text).not.toContain("organization_id");
    expect(params).toContain(22);
    expect(params).not.toContain(orgA);
  });
});

test.each([false, true])("indicador preserva o intervalo de datas (Superadmin=%s)", async superadmin => {
  await firmsRepository.getFirmsDataByDateRange(orgA, superadmin, start, end);
  const [{ text }, params] = query.mock.calls[0];
  expect(text).toMatch(/"acq_date" >= \$\d+/);
  expect(text).toMatch(/"acq_date" <= \$\d+/);
  expect(params).toEqual(expect.arrayContaining([start, end]));
});
