import { PgDialect } from "drizzle-orm/pg-core";
import { db } from "@/db";
import { importGpx } from "../gpxImportService";

const where = jest.fn();
const values = jest.fn();
const returning = jest.fn();

jest.mock("@/db", () => ({
  db: {
    select: jest.fn(),
    transaction: jest.fn(),
  },
}));
jest.mock("@/lib/supabase/admin", () => ({ createAdminClient: jest.fn().mockReturnValue({}) }));

const tenantId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

beforeEach(() => {
  jest.clearAllMocks();
  returning.mockResolvedValueOnce([{ id: 31 }]).mockResolvedValueOnce([{ id: 32 }]);
  values.mockImplementation(() => ({ returning }));
  const tx = { insert: jest.fn().mockReturnValue({ values }) };
  (db.transaction as jest.Mock).mockImplementation(async callback => callback(tx));
  where.mockImplementation(() => ({ limit: jest.fn().mockResolvedValue([{ id: 12 }]) }));
  (db.select as jest.Mock).mockReturnValue({ from: jest.fn().mockReturnValue({ where }) });
});

test("importação confere dono da região e grava tenant em trilha e ações", async () => {
  const result = await importGpx({
    tenantId,
    regiaoId: 12,
    trilha: { nome: "Trilha", geom: "MULTILINESTRING Z ((1 2 0,3 4 0))" },
    acoes: [{
      nome: "Ação", acao: "Monitorar", categoria: "Monitoramento", tipo: "Campo",
      status: "Identificado", eixoTematico: "Água", tipoTecnico: "Visual",
      carater: "Rotina", latitude: -20, longitude: -56,
    }],
  });

  const predicate = new PgDialect().sqlToQuery(where.mock.calls[0][0]);
  expect(predicate.sql).toContain("organization_id");
  expect(predicate.params).toEqual(expect.arrayContaining([12, tenantId]));
  expect(values).toHaveBeenCalledTimes(2);
  expect(values.mock.calls[0][0]).toMatchObject({ tenantId, regiaoId: 12 });
  expect(values.mock.calls[1][0]).toMatchObject({ tenantId, regiaoId: 12 });
  expect(result).toMatchObject({ trilhaId: 31, acoesIds: [32] });
});
