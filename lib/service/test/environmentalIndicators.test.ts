import { getAllFirmsData, getFocosIndicador } from "../firmsService";
import { getAllDesmatamentoDataGroupedByMonthAndYear } from "../desmatamentoService";
import { findAllFirmsData, firmsRepository } from "@/lib/repositories/firmsRepository";
import { findAllDesmatamentoData } from "@/lib/repositories/desmatamentoReposiroty";

jest.mock("@/lib/repositories/firmsRepository", () => ({
  findAllFirmsData: jest.fn(), firmsRepository: { getFirmsDataByDateRange: jest.fn() },
}));
jest.mock("@/lib/repositories/desmatamentoReposiroty", () => ({ findAllDesmatamentoData: jest.fn() }));

const allFirms = jest.mocked(findAllFirmsData);
const range = jest.mocked(firmsRepository.getFirmsDataByDateRange);
const desmatamento = jest.mocked(findAllDesmatamentoData);

function firmsResult(rows: { acq_date: string }[]) {
  return { command: "SELECT", rowCount: rows.length, oid: 0, fields: [], rows };
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers().setSystemTime(new Date("2026-09-30T12:00:00Z"));
});
afterEach(() => jest.useRealTimers());

describe.each([
  { tenantId: "org-a", superadmin: false, current: 2, previous: 1, hectares: [1.5, 2.25] },
  { tenantId: "org-b", superadmin: false, current: 1, previous: 2, hectares: [10] },
  { tenantId: "org-a", superadmin: true, current: 3, previous: 3, hectares: [1.5, 2.25, 10] },
])("indicadores $tenantId (Superadmin=$superadmin)", ({ tenantId, superadmin, current, previous, hectares }) => {
  test("contagens mensais e indicador usam o mesmo escopo e preservam o formato", async () => {
    const focos = Array.from({ length: current }, (_, i) => ({
      id: `foco-${i}`, acqDate: "2026-09-15", acqTime: "1200", latitude: 0, longitude: 0,
    }));
    allFirms.mockResolvedValue(firmsResult(focos.map(f => ({ acq_date: f.acqDate }))));
    range.mockResolvedValueOnce(focos).mockResolvedValueOnce(Array.from({ length: previous }, (_, i) => ({
      ...focos[0], id: `anterior-${i}`, acqDate: "2026-08-15",
    })));

    const monthly = await getAllFirmsData(tenantId, superadmin);
    const indicator = await getFocosIndicador(tenantId, superadmin);

    expect(allFirms).toHaveBeenCalledWith(tenantId, superadmin, undefined);
    expect(range.mock.calls).toEqual([
      [tenantId, superadmin, "2026-08-31", "2026-09-30", undefined],
      [tenantId, superadmin, "2026-08-01", "2026-08-31", undefined],
    ]);
    expect(monthly[2026]).toHaveLength(12);
    expect(monthly[2026][8]).toBe(current);
    expect(monthly[2026].reduce((a, b) => a + b, 0)).toBe(current);
    expect(indicator).toEqual({ current, previous, deltaPct: ((current - previous) / previous) * 100, sparkline: expect.any(Array), lastDate: "2026-09-15" });
    expect(indicator.sparkline).toHaveLength(30);
    expect(indicator.sparkline[14]).toBe(current);
    expect(indicator.sparkline.reduce((a, b) => a + b, 0)).toBe(current);
  });

  test("soma somente hectares retornados pelo repositório com escopo", async () => {
    desmatamento.mockResolvedValue(hectares.map((alertha, i) => ({
      alertid: `alerta-${i}`, alertha, detectat: "2026-09-15", detectyear: 2026, state: null, stateha: null,
    })));
    const monthly = await getAllDesmatamentoDataGroupedByMonthAndYear(tenantId, superadmin);
    expect(desmatamento).toHaveBeenCalledWith(tenantId, superadmin, undefined);
    expect(monthly[2026]).toHaveLength(12);
    expect(monthly[2026][8]).toBe(hectares.reduce((a, b) => a + b, 0));
    expect(monthly[2026].filter(value => value !== 0)).toHaveLength(1);
  });
});

test("Organização sem dados recebe séries vazias e indicador zerado", async () => {
  allFirms.mockResolvedValue(firmsResult([]));
  desmatamento.mockResolvedValue([]);
  range.mockResolvedValue([]);
  expect(await getAllFirmsData("sem-dados", false)).toEqual({});
  expect(await getAllDesmatamentoDataGroupedByMonthAndYear("sem-dados", false)).toEqual({});
  expect(await getFocosIndicador("sem-dados", false)).toEqual({ current: 0, previous: 0, deltaPct: null, sparkline: Array(30).fill(0), lastDate: null });
});

test("propaga Região explícita para todas as consultas, inclusive os dois períodos", async () => {
  allFirms.mockResolvedValue(firmsResult([]));
  desmatamento.mockResolvedValue([]);
  range.mockResolvedValue([]);
  await getAllFirmsData("org-a", false, 12);
  await getAllDesmatamentoDataGroupedByMonthAndYear("org-a", false, 12);
  await getFocosIndicador("org-a", false, 12);
  expect(allFirms).toHaveBeenCalledWith("org-a", false, 12);
  expect(desmatamento).toHaveBeenCalledWith("org-a", false, 12);
  expect(range.mock.calls.every(call => call[0] === "org-a" && call[1] === false && call[4] === 12)).toBe(true);
});
