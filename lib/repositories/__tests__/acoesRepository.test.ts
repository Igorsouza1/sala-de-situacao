/**
 * Testes para acoesRepository — task 2.3
 *
 * Verifica que as funções de leitura exigem tenantId explícito (ADR 0010)
 * e filtram os dados por tenant. Sem tenantId → erro, nunca fallback silencioso.
 */

jest.mock("@/db", () => ({
  db: {
    select: jest.fn(),
    execute: jest.fn(),
  },
}));

import { findAllAcoesData, findAllAcoesDataWithGeometry } from "../acoesRepository";
import { db } from "@/db";

const REAL_TENANT = "real-1111-1111-1111-111111111111";

beforeEach(() => {
  jest.clearAllMocks();
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

  it("lança erro quando tenantId não fornecido (ADR 0010: sem fallback)", async () => {
    setupSelectMock([]);

    await expect(findAllAcoesData()).rejects.toThrow(/tenantId é obrigatório/);
    expect(db.select).not.toHaveBeenCalled();
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

  it("lança erro quando tenantId não fornecido (ADR 0010: sem fallback)", async () => {
    await expect(findAllAcoesDataWithGeometry()).rejects.toThrow(/tenantId é obrigatório/);
    expect(db.execute).not.toHaveBeenCalled();
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

  it("tenantId=undefined com datas também lança erro", async () => {
    await expect(
      findAllAcoesDataWithGeometry(undefined, new Date("2024-06-01"))
    ).rejects.toThrow(/tenantId é obrigatório/);
  });
});
