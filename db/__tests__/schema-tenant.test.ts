/**
 * Testes de estrutura do schema Drizzle — Fase 1 Multi-Tenancy
 *
 * Verifica que db/schema.ts está em sync com a migration 0005:
 * - tenantsInMonitoramento existe com as colunas corretas
 * - rolesInMonitoramento existe com RBAC de 5 níveis
 * - Tabelas de dados possuem coluna tenantId
 *
 * Não conecta no banco — inspeciona a definição Drizzle em memória.
 */

import {
  tenantsInMonitoramento,
  rolesInMonitoramento,
  acoesInMonitoramento,
  trilhasInMonitoramento,
  waypointsInMonitoramento,
  desmatamentoInMonitoramento,
  propriedadesInMonitoramento,
  estradasInMonitoramento,
  rawFirmsInMonitoramento,
  layerCatalogInMonitoramento,
  layerDataInMonitoramento,
  javaliAvistamentosInMonitoramento,
  dequeDePedrasInMonitoramento,
  balnearioMunicipalInMonitoramento,
  ponteDoCureInMonitoramento,
} from "../schema";

// Helper: retorna os nomes de colunas de uma tabela Drizzle
function columnNames(table: Record<string, any>): string[] {
  return Object.keys(table).filter(
    (k) => table[k] && typeof table[k] === "object" && "name" in table[k]
  );
}

// ---------------------------------------------------------------
// 1.1 — tenantsInMonitoramento
// ---------------------------------------------------------------
describe("tenantsInMonitoramento", () => {
  it("deve existir e ser exportado do schema", () => {
    expect(tenantsInMonitoramento).toBeDefined();
  });

  it("deve ter nome de tabela 'tenants' (não 'organizations')", () => {
    expect((tenantsInMonitoramento as any)[Symbol.for("drizzle:Name")]).toBe("tenants");
  });

  const requiredColumns = ["id", "name", "slug", "plan", "maxUsers", "storageQuotaGb", "active", "metadata", "createdAt", "updatedAt"];

  requiredColumns.forEach((col) => {
    it(`deve ter coluna '${col}'`, () => {
      expect(tenantsInMonitoramento).toHaveProperty(col);
    });
  });
});

// ---------------------------------------------------------------
// 1.2 — rolesInMonitoramento
// ---------------------------------------------------------------
describe("rolesInMonitoramento", () => {
  it("deve existir e ser exportado do schema", () => {
    expect(rolesInMonitoramento).toBeDefined();
  });

  it("deve ter nome de tabela 'roles'", () => {
    expect((rolesInMonitoramento as any)[Symbol.for("drizzle:Name")]).toBe("roles");
  });

  const requiredColumns = ["id", "tenantId", "userId", "role", "regionId", "createdAt"];

  requiredColumns.forEach((col) => {
    it(`deve ter coluna '${col}'`, () => {
      expect(rolesInMonitoramento).toHaveProperty(col);
    });
  });
});

// ---------------------------------------------------------------
// 1.3 — tenantId nas tabelas de dados
// ---------------------------------------------------------------
const DATA_TABLES: [string, Record<string, any>][] = [
  ["acoesInMonitoramento",              acoesInMonitoramento],
  ["trilhasInMonitoramento",            trilhasInMonitoramento],
  ["waypointsInMonitoramento",          waypointsInMonitoramento],
  ["desmatamentoInMonitoramento",       desmatamentoInMonitoramento],
  ["propriedadesInMonitoramento",       propriedadesInMonitoramento],
  ["estradasInMonitoramento",           estradasInMonitoramento],
  ["rawFirmsInMonitoramento",           rawFirmsInMonitoramento],
  ["layerCatalogInMonitoramento",       layerCatalogInMonitoramento],
  ["layerDataInMonitoramento",          layerDataInMonitoramento],
  ["javaliAvistamentosInMonitoramento", javaliAvistamentosInMonitoramento],
  ["dequeDePedrasInMonitoramento",      dequeDePedrasInMonitoramento],
  ["balnearioMunicipalInMonitoramento", balnearioMunicipalInMonitoramento],
  ["ponteDoCureInMonitoramento",        ponteDoCureInMonitoramento],
];

describe("tenantId nas tabelas de dados", () => {
  DATA_TABLES.forEach(([tableName, table]) => {
    it(`${tableName} deve ter coluna 'tenantId'`, () => {
      expect(table).toHaveProperty("tenantId");
    });
  });
});
