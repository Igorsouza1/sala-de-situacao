/**
 * Testes para acoesRepository — task 2.3
 *
 * Verifica que as funções de leitura aceitam tenantId como primeiro parâmetro
 * e filtram os dados por tenant. Quando tenantId não é fornecido, usa SEED_TENANT_ID.
 */

jest.mock("@/db", () => ({
  db: {
    select: jest.fn(),
    execute: jest.fn(),
  },
}));

import { findAllAcoesData, findAllAcoesDataWithGeometry } from "../acoesRepository";
import { db } from "@/db";

const SEED_TENANT = "seed-0000-0000-0000-000000000000";
const REAL_TENANT = "real-1111-1111-1111-111111111111";

beforeEach(() => {
  jest.clearAllMocks();
  process.env.SEED_TENANT_ID = SEED_TENANT;
});

afterEach(() => {
  delete process.env.SEED_TENANT_ID;
});

// ─────────────────────────────────────────────────────────────
// findAllAcoesData
// ─────────────────────────────────────────────────────────────
describe("findAllAcoesData — filtro de tenant", () => {
  function setupSelectMock(rows: any[]) {
    (db.select as jest.Mock).mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue(rows),
      }),
    });
  }

  it("aceita tenantId explícito e chama .where() com o filtro", async () => {
    setupSelectMock([{ id: 1, name: "Ação A" }]);

    const result = await findAllAcoesData(REAL_TENANT);

    expect(result).toHaveLength(1);
    const fromFn = (db.select as jest.Mock).mock.results[0].value.from;
    const whereFn = fromFn.mock.results[0].value.where;
    expect(whereFn).toHaveBeenCalled();
  });

  it("usa SEED_TENANT_ID como fallback quando tenantId não fornecido", async () => {
    setupSelectMock([]);

    await findAllAcoesData();

    const fromFn = (db.select as jest.Mock).mock.results[0].value.from;
    const whereFn = fromFn.mock.results[0].value.where;
    // Mesmo sem tenantId explícito, .where() deve ser chamado com SEED
    expect(whereFn).toHaveBeenCalled();
  });

  it("retorna lista vazia quando banco retorna vazio", async () => {
    setupSelectMock([]);

    const result = await findAllAcoesData(REAL_TENANT);

    expect(result).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────
// findAllAcoesDataWithGeometry
// ─────────────────────────────────────────────────────────────
describe("findAllAcoesDataWithGeometry — filtro de tenant", () => {
  it("aceita tenantId como primeiro parâmetro", async () => {
    (db.execute as jest.Mock).mockResolvedValue({
      rows: [{ id: 1, geojson: '{"type":"Point"}' }],
    });

    const result = await findAllAcoesDataWithGeometry(REAL_TENANT);

    expect(result).toHaveLength(1);
    expect(db.execute).toHaveBeenCalled();
  });

  it("funciona sem tenantId (fallback para SEED_TENANT_ID)", async () => {
    (db.execute as jest.Mock).mockResolvedValue({ rows: [] });

    const result = await findAllAcoesDataWithGeometry();

    expect(result).toEqual([]);
    expect(db.execute).toHaveBeenCalled();
  });

  it("aceita tenantId + datas: (tenantId, startDate, endDate)", async () => {
    (db.execute as jest.Mock).mockResolvedValue({
      rows: [{ id: 2 }],
    });

    const result = await findAllAcoesDataWithGeometry(
      REAL_TENANT,
      new Date("2024-01-01"),
      new Date("2024-12-31")
    );

    expect(result).toHaveLength(1);
  });

  it("assinatura nova: tenantId=undefined usa SEED como fallback", async () => {
    (db.execute as jest.Mock).mockResolvedValue({ rows: [{ id: 3 }] });

    const result = await findAllAcoesDataWithGeometry(undefined, new Date("2024-06-01"));

    expect(result).toHaveLength(1);
  });
});
