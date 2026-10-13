import { getJavaliIndicador } from "./javaliService"
import { countJavaliAvistamentos, findJavaliAvistamentosByDateRange } from "@/lib/repositories/javaliRepository"

jest.mock("@/lib/repositories/javaliRepository", () => ({
  countJavaliAvistamentos: jest.fn(),
  findJavaliAvistamentosByDateRange: jest.fn(),
}))

afterEach(() => jest.useRealTimers())

test("indicador usa contagem e apenas os seis meses recentes", async () => {
  jest.useFakeTimers()
  jest.setSystemTime(new Date("2026-10-09T12:00:00Z"))
  jest.mocked(countJavaliAvistamentos).mockResolvedValue(100)
  jest.mocked(findJavaliAvistamentosByDateRange).mockResolvedValue([
    { id: 1, createdAt: "2026-09-12" },
    { id: 2, createdAt: "2026-10-01" },
    { id: 3, createdAt: "2026-10-02" },
  ] as any)

  const result = await getJavaliIndicador()

  expect(countJavaliAvistamentos).toHaveBeenCalledTimes(1)
  expect(findJavaliAvistamentosByDateRange).toHaveBeenCalledTimes(1)
  expect(findJavaliAvistamentosByDateRange).toHaveBeenCalledWith("2026-05-01", "2026-10-09")
  expect(result).toMatchObject({ total: 100, thisMonth: 2, lastMonth: 1, sparkline: [0, 0, 0, 0, 1, 2] })
})
