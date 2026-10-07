import { desmatamento, focos, javali, quando, turbidez, visibilidade } from "../estado"

const hoje = new Date("2026-10-07T12:00:00")

describe("turbidez", () => {
  test.each([
    [2, "ok", "Água clara"],
    [3, "ok", "Água clara"],
    [5, "atencao", "Água um pouco turva"],
    [12, "atencao", "Água turva"],
    [20, "crit", "Água muito turva"],
  ])("%s NTU", (ntu, tom, frase) => expect(turbidez(ntu)).toEqual({ tom, frase }))

  test("sem medida não vira verde", () => {
    expect(turbidez(null).tom).toBe("neutro")
    expect(turbidez(NaN).tom).toBe("neutro")
  })
})

test("visibilidade usa as palavras do campo", () => {
  expect(visibilidade("cristalino").tom).toBe("ok")
  expect(visibilidade("muitoTurvo").tom).toBe("crit")
  expect(visibilidade(undefined).tom).toBe("neutro")
})

describe("quando", () => {
  test.each([
    ["2026-10-07", "hoje"],
    ["2026-10-06", "ontem"],
    ["2026-10-02", "há 5 dias"],
    ["2026-08-15", "em 15 de agosto de 2026"],
  ])("%s", (iso, esperado) => expect(quando(iso, hoje)).toBe(esperado))

  test("sem data ou data inválida", () => {
    expect(quando(null, hoje)).toBeNull()
    expect(quando("lixo", hoje)).toBeNull()
  })
})

describe("focos", () => {
  test("nenhum foco é tudo certo", () => expect(focos(0, 3, null, hoje).tom).toBe("ok"))
  test("com foco diz o último e sobe para crítico se aumentou", () => {
    const r = focos(4, 2, "2026-10-05", hoje)
    expect(r.tom).toBe("crit")
    expect(r.frase).toBe("4 focos nos últimos 30 dias")
    expect(r.apoio).toBe("Último foco há 2 dias")
  })
  test("singular e sem leitura", () => {
    expect(focos(1, 1, "2026-10-07", hoje).frase).toBe("1 foco nos últimos 30 dias")
    expect(focos(null, null, null, hoje).tom).toBe("neutro")
  })
})

describe("desmatamento", () => {
  test("acha o último mês com área e soma o ano", () => {
    const r = desmatamento({ 2025: [0, 1.5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 2026: [0, 0, 2, 0.5, 0, 0, 0, 0, 0, 0, 0, 0] })
    expect(r.frase).toBe("2,5 ha de alertas em 2026")
    expect(r.apoio).toBe("Último alerta em abril de 2026")
    expect(r.serie).toHaveLength(12)
  })
  test("sem alertas e sem dado", () => {
    expect(desmatamento({ 2026: Array(12).fill(0) }).tom).toBe("ok")
    expect(desmatamento(null).tom).toBe("neutro")
  })
})

test("javali conta o mês e compara com o anterior", () => {
  expect(javali(0, 4).tom).toBe("ok")
  expect(javali(3, 1)).toMatchObject({ tom: "atencao", frase: "3 relatos de javali neste mês", apoio: "No mês passado foram 1" })
  expect(javali(null, null).tom).toBe("neutro")
})
