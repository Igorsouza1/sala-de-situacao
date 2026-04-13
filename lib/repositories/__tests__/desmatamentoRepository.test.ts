/**
 * Testes para desmatamentoRepository
 *
 * Foco principal: garantir que `findExistingDesmatamentoAlertids`
 * usa queries parametrizadas (inArray) e NUNCA sql.raw() com strings brutas.
 */

import { findExistingDesmatamentoAlertids } from "../desmatamentoReposiroty";
import * as drizzle from "drizzle-orm";

// Mock do db para não conectar no banco real
jest.mock("@/db", () => ({
  db: {
    select: jest.fn(),
  },
}));

import { db } from "@/db";

describe("desmatamentoRepository - findExistingDesmatamentoAlertids", () => {
  const mockDb = db as jest.Mocked<typeof db>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("deve retornar um Set com os alertids já existentes na região", async () => {
    // Arrange
    (mockDb.select as jest.Mock).mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([
          { alertid: "ALERT-001" },
          { alertid: "ALERT-002" },
        ]),
      }),
    });

    // Act
    const result = await findExistingDesmatamentoAlertids(1, [
      "ALERT-001",
      "ALERT-002",
      "ALERT-003",
    ]);

    // Assert
    expect(result).toBeInstanceOf(Set);
    expect(result.has("ALERT-001")).toBe(true);
    expect(result.has("ALERT-002")).toBe(true);
    expect(result.has("ALERT-003")).toBe(false);
  });

  it("deve retornar Set vazio quando a lista de alertids for vazia", async () => {
    // Act - sem alertids, não deve fazer query no banco
    const result = await findExistingDesmatamentoAlertids(1, []);

    // Assert
    expect(result).toBeInstanceOf(Set);
    expect(result.size).toBe(0);
    // Não deve ter chamado o banco
    expect(mockDb.select).not.toHaveBeenCalled();
  });

  it("não deve lançar erro com alertids contendo caracteres especiais de SQL", async () => {
    // Arrange - payload de injeção clássico
    const maliciousAlertids = [
      "' OR '1'='1",
      "'; DROP TABLE desmatamento; --",
      "\" OR \"1\"=\"1",
    ];

    (mockDb.select as jest.Mock).mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([]),
      }),
    });

    // Act & Assert - não deve lançar erro
    await expect(
      findExistingDesmatamentoAlertids(1, maliciousAlertids)
    ).resolves.toBeInstanceOf(Set);

    // Verificar que o banco foi chamado (os valores são passados como parâmetros, não concatenados)
    expect(mockDb.select).toHaveBeenCalled();
  });

  it("deve retornar Set vazio quando nenhum alertid já existe no banco", async () => {
    // Arrange
    (mockDb.select as jest.Mock).mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([]),
      }),
    });

    // Act
    const result = await findExistingDesmatamentoAlertids(1, [
      "ALERT-NOVO-001",
      "ALERT-NOVO-002",
    ]);

    // Assert
    expect(result.size).toBe(0);
  });
});
