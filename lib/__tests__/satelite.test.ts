import { contornoNoRecorte, escolherCenas, janelaDeBusca, LADO_MAXIMO_M, LADO_MINIMO_M, nuvemEmPalavras, nuvemLocal, paraMedir, recorteDoAlerta, urlRecorteSentinel, type CenaStac } from "../satelite"

const cena = (id: string, datetime: string, nuvem: number): CenaStac => ({ id, datetime: `${datetime}T13:57:01Z`, nuvem })

test("antes respeita 30 dias de folga; depois é a primeira limpa a partir do alerta", () => {
  const r = escolherCenas([
    cena("a", "2026-07-01", 3), cena("b", "2026-08-10", 8), cena("c", "2026-08-25", 40),
    cena("d", "2026-09-05", 60), cena("e", "2026-09-12", 10), cena("f", "2026-09-20", 2),
  ], "2026-09-01")
  // b (22 dias antes) é recente demais: o corte pode já ter acontecido
  expect(r.antes).toMatchObject({ id: "a", data: "2026-07-01", nublada: false })
  expect(r.depois).toMatchObject({ id: "e", data: "2026-09-12", nublada: false })
})

test("sem foto com folga, usa a mais próxima antes do alerta; o dia do alerta conta como depois", () => {
  const r = escolherCenas([cena("x", "2026-09-01", 1), cena("y", "2026-08-30", 1)], "2026-09-01")
  expect(r.antes?.id).toBe("y")
  expect(r.depois?.id).toBe("x")
})

test("oferece fotos de antes mais antigas, espaçadas, para quando o corte já aparece na escolhida", () => {
  const r = escolherCenas([
    cena("a", "2026-06-01", 2), cena("b", "2026-06-05", 2), cena("c", "2026-05-10", 3),
    cena("d", "2026-04-01", 4), cena("e", "2026-03-01", 90), cena("f", "2026-02-01", 1),
  ], "2026-09-01")
  expect(r.antes?.id).toBe("b")
  // a (4 dias antes de b) é parecida demais; e está nublada
  expect(r.antesMaisAntigas.map((c) => c.id)).toEqual(["c", "d", "f"])
})

test("sem cena limpa, escolhe a menos nublada e avisa", () => {
  const r = escolherCenas([cena("a", "2026-08-30", 70), cena("b", "2026-08-01", 35), cena("c", "2026-08-20", 90)], "2026-09-01")
  expect(r.antes).toMatchObject({ id: "b", nublada: true })
  expect(r.depois).toBeNull()
})

test("sem nenhuma cena, os dois lados ficam vazios", () => {
  expect(escolherCenas([], "2026-09-01")).toEqual({ antes: null, depois: null, antesMaisAntigas: [] })
})

test("a janela vai 90 dias antes e 60 depois, sem passar de hoje", () => {
  const j = janelaDeBusca("2026-09-01", new Date("2026-12-31T00:00:00Z"))
  expect(j.inicio).toBe("2026-06-03T00:00:00.000Z")
  expect(j.fim).toBe("2026-10-31T00:00:00.000Z")
  expect(janelaDeBusca("2026-09-01", new Date("2026-09-10T12:00:00Z")).fim).toBe("2026-09-10T12:00:00.000Z")
})

test("a nuvem local conta nuvem, sombra e cirro, e ignora solo e vegetação", () => {
  // classes: 4 vegetação, 5 solo, 8 nuvem, 3 sombra
  expect(nuvemLocal([[50, 30, 15, 5], [4, 5, 8, 3]])).toBeCloseTo(20)
  expect(nuvemLocal([[784], [4]])).toBe(0)
  expect(nuvemLocal([[], []])).toBeNull()
})

test("só as primeiras fotos de cada lado são medidas de perto", () => {
  const muitas = Array.from({ length: 12 }, (_, i) => cena(`a${i}`, `2026-0${(i % 6) + 1}-1${i % 9}`, 5))
  expect(paraMedir(muitas, "2026-09-01").length).toBeLessThanOrEqual(16)
})

test("a nuvem vira palavra", () => {
  expect(nuvemEmPalavras(2)).toBe("sem nuvens")
  expect(nuvemEmPalavras(15)).toBe("com poucas nuvens")
  expect(nuvemEmPalavras(80)).toBe("quase toda coberta de nuvens")
})

const ladoM = (c: [number, number, number, number]) => (c[3] - c[1]) * 111_320

test("o recorte é quadrado, centrado no alerta e nunca menor que o mínimo", () => {
  const alerta: [number, number, number, number] = [-56.6102, -21.2902, -56.6098, -21.2898]
  const c = recorteDoAlerta(alerta)
  expect((c[0] + c[2]) / 2).toBeCloseTo(-56.61, 6)
  expect((c[1] + c[3]) / 2).toBeCloseTo(-21.29, 6)
  expect(ladoM(c)).toBeCloseTo(LADO_MINIMO_M, 0)
  // quadrado em metros: a largura em graus é maior que a altura por causa da latitude
  const larguraM = (c[2] - c[0]) * 111_320 * Math.cos((21.29 * Math.PI) / 180)
  expect(larguraM).toBeCloseTo(ladoM(c), 0)
})

test("alerta grande ganha entorno proporcional, até o máximo", () => {
  const medio = recorteDoAlerta([-56.62, -21.30, -56.61, -21.29])
  expect(ladoM(medio)).toBeGreaterThan(LADO_MINIMO_M)
  expect(ladoM(recorteDoAlerta([-57, -22, -56, -21]))).toBeCloseTo(LADO_MAXIMO_M, 0)
})

test("o endereço da foto pede só o recorte da cena escolhida", () => {
  const url = urlRecorteSentinel("S2C_X", [-56.62, -21.3, -56.61, -21.29])
  expect(url).toContain("/item/bbox/-56.620000,-21.300000,-56.610000,-21.290000/400x400.jpg")
  expect(url).toContain("item=S2C_X")
})

test("o contorno vira um caminho dentro da foto, com o norte para cima", () => {
  const caixa: [number, number, number, number] = [0, 0, 10, 10]
  const d = contornoNoRecorte({ type: "Polygon", coordinates: [[[2, 2], [8, 2], [8, 8], [2, 8], [2, 2]]] }, caixa, 100)
  expect(d).toBe("M20.0 80.0 L80.0 80.0 L80.0 20.0 L20.0 20.0 L20.0 80.0 Z")
  expect(contornoNoRecorte({ type: "Point", coordinates: [1, 1] }, caixa)).toBe("")
})
