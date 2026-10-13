import { getTurbidezDequeHistorico } from "./dequeService"
import { getSecchiBalnearioHistorico } from "./balnearioService"
import { findAllDequeData, findDequeDataByDateRange } from "@/lib/repositories/dequeRepository"
import { findAllBalnearioData, findBalnearioDataByDateRange } from "@/lib/repositories/balnearioRepository"

jest.mock("@/lib/repositories/dequeRepository", () => ({
  findAllDequeData: jest.fn(),
  findDequeDataByDateRange: jest.fn(),
  insertDequeData: jest.fn(),
}))
jest.mock("@/lib/repositories/balnearioRepository", () => ({
  findAllBalnearioData: jest.fn(),
  findBalnearioDataByDateRange: jest.fn(),
  insertBalnearioData: jest.fn(),
}))

beforeEach(() => {
  jest.resetAllMocks()
  jest.useFakeTimers()
  jest.setSystemTime(new Date("2026-10-09T12:00:00Z"))
  jest.mocked(findDequeDataByDateRange).mockResolvedValue([])
  jest.mocked(findBalnearioDataByDateRange).mockResolvedValue([])
})

afterEach(() => jest.useRealTimers())

test("histórico do Deque consulta apenas o ano escolhido no banco", async () => {
  jest.mocked(findDequeDataByDateRange).mockResolvedValue([{ data: "2026-01-01", turbidez: "5" }] as any)
  const data = await getTurbidezDequeHistorico("org-a", 2026)
  expect(findDequeDataByDateRange).toHaveBeenCalledWith("org-a", "2026-01-01", "2026-12-31")
  expect(findAllDequeData).not.toHaveBeenCalled()
  expect(data.map((point) => point.periodo)).toEqual(Array.from({ length: 10 }, (_, i) => `2026-${String(i + 1).padStart(2, "0")}`))
  expect(data[0].turbidez).toBe(5)
})

test("histórico do Balneário consulta apenas o ano escolhido no banco", async () => {
  jest.mocked(findBalnearioDataByDateRange).mockResolvedValue([{ data: "2026-01-01", secchiVertical: "1.5" }] as any)
  const data = await getSecchiBalnearioHistorico("org-a", 2026)
  expect(findBalnearioDataByDateRange).toHaveBeenCalledWith("org-a", "2026-01-01", "2026-12-31")
  expect(findAllBalnearioData).not.toHaveBeenCalled()
  expect(data.map((point) => point.periodo)).toEqual(Array.from({ length: 10 }, (_, i) => `2026-${String(i + 1).padStart(2, "0")}`))
  expect(data[0].secchi).toBe(1.5)
})
