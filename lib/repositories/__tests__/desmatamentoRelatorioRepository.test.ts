import { db } from "@/db"
import { findRelatorioDesmatamento } from "../desmatamentoRelatorioRepository"

jest.mock("@/db", () => {
  const { drizzle } = jest.requireActual("drizzle-orm/node-postgres")
  return { db: drizzle({ client: { query: jest.fn() } }) }
})

const query = db.$client.query as jest.Mock
const tenant = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"

beforeEach(() => jest.clearAllMocks())

test("nega alerta sem vínculo com a região antes de buscar propriedades", async () => {
  query.mockResolvedValueOnce({ rows: [] })
  expect(await findRelatorioDesmatamento(10, tenant, false, 1)).toBeNull()
  expect(query).toHaveBeenCalledTimes(1)
  const [{ text }, values] = query.mock.calls[0]
  expect(text).toContain("desmatamento_regioes")
  expect(text).toContain("r.organization_id =")
  expect(values).toEqual(expect.arrayContaining([10, tenant, 1]))
})

test("cada alerta do relatório usa o escopo da região e recorta a área pela propriedade", async () => {
  query.mockResolvedValueOnce({ rows: [{ id: 10, data: "2026-10-09", area_total: 12 }] })
  query.mockResolvedValueOnce({ rows: [] })
  await findRelatorioDesmatamento(10, tenant, false, 1)
  const [{ text }, values] = query.mock.calls[1]
  expect(text).toContain("dr.desmatamento_id = d.id")
  expect(text).toContain("ST_Intersection(d.geom, p.geom)")
  expect(text).toContain("ST_Area(recorte.geom::geography)")
  expect(values).toEqual(expect.arrayContaining([10, tenant, 1]))
})
