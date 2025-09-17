import { findAllDequeData, findDequeDataByDateRange, insertDequeData } from "../repositories/dequeRepository"
import { createDequeSchema } from "../validations/deque"
import Zod  from "zod"

interface MonthData {
    chuva: number
    turbidez?: number[]
    turbidezMax?: number
    turbidezMin?: number
    turbidezMedia?: number
  }

export async function getAllDequeDataGroupedByMonth(){
    const dequeData = await findAllDequeData()
    // Agrupar os dados por mês
    const groupedData = dequeData.reduce(
        (acc, item) => {
          if (item.data) {
            const date = new Date(item.data)
            const year = date.getFullYear()
            const month = date.getMonth()
  
            if (!acc[year]) {
              acc[year] = Array(12)
                .fill(null)
                .map(() => ({ chuva: 0, turbidez: [] }))
            }
  
            acc[year][month].chuva += Number(item.chuva) || 0
            if (item.turbidez !== null) {
              acc[year][month].turbidez!.push(Number(item.turbidez))
            }
          }
  
          return acc
        },
        {} as Record<number, MonthData[]>,
      )
  
      // Calcular máxima, mínima e média da turbidez
      Object.values(groupedData).forEach((yearData) => {
        yearData.forEach((monthData) => {
          if (monthData.turbidez && monthData.turbidez.length > 0) {
            monthData.turbidezMax = Math.max(...monthData.turbidez)
            monthData.turbidezMin = Math.min(...monthData.turbidez)
            monthData.turbidezMedia = monthData.turbidez.reduce((sum, val) => sum + val, 0) / monthData.turbidez.length
            delete monthData.turbidez // Remove o array original de turbidez
          }
        })
      })


    return groupedData
}



export async function getDequeDataByDateRange(startDate: string, endDate: string){
    const dequeData = await findDequeDataByDateRange(startDate, endDate)
    return dequeData
}


type DequeInput = Zod.infer<typeof createDequeSchema>;


export async function createDequeData(input: DequeInput){
    const validatedData = createDequeSchema.parse(input);

    const mes = validatedData.data.toLocaleString('pt-BR', { month: 'long' });

    const completeData = {
      data: validatedData.data.toISOString().split('T')[0],
      local: "Deque de Pedras",
      mes: mes,
  
      turbidez: validatedData.turbidez.toString(),
      secchiVertical: validatedData.secchiVertical.toString(),
      secchiHorizontal: validatedData.secchiHorizontal.toString(),
      chuva: validatedData.chuva.toString(),
    };

  const newEntry = await insertDequeData(completeData);

  return newEntry;
}


export async function getchuvaComparativoPct() {
  const today = new Date()
  const year = today.getFullYear()
  const month0 = today.getMonth()
  const day = today.getDate()

  const startThis = new Date(year, month0, 1)
  const endThis = today

  const lastYear = year - 1
  const lastDayLastYear = new Date(lastYear, month0 + 1, 0).getDate()
  const endLast = new Date(lastYear, month0, Math.min(day, lastDayLastYear))
  const startLast = new Date(lastYear, month0, 1)

  const fmt = (d: Date) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, "0")
    const dd = String(d.getDate()).padStart(2, "0")
    return `${y}-${m}-${dd}`
  }
  const toNum = (v: any) => (v === null || v === undefined ? NaN : Number(v))

  const [rowsAtual, rowsPassado] = await Promise.all([
    getDequeDataByDateRange(fmt(startThis), fmt(endThis)),
    getDequeDataByDateRange(fmt(startLast), fmt(endLast)),
  ])

  // ordene por data para garantir a "última" linha correta
  const byDateAsc = (a: any, b: any) => new Date(a?.data).getTime() - new Date(b?.data).getTime()

  const validAtual = (rowsAtual ?? [])
    .filter((r) => !isNaN(toNum(r?.chuva)))
    .sort(byDateAsc)

  const validPassado = (rowsPassado ?? [])
    .filter((r) => !isNaN(toNum(r?.chuva)))
    .sort(byDateAsc)

  const lastRowAtual = validAtual.length ? validAtual[validAtual.length - 1] : null

  const mean = (rows: any[]) => {
    const vals = rows.map((r) => toNum(r?.chuva)).filter((v) => Number.isFinite(v))
    if (!vals.length) return null
    return vals.reduce((a, b) => a + b, 0) / vals.length
  }

  const mtdAtual = mean(validAtual)
  const mtdPassado = mean(validPassado)
  const deltaPct =
    mtdAtual !== null && mtdPassado !== null && mtdPassado !== 0
      ? ((mtdAtual - mtdPassado) / mtdPassado) * 100
      : null

  // ✅ compare por DIA (ignora hora/fuso)
  let dadosAtrasados = true
  let ultimaDataUsada: string | null = null
  let diasSemAtualizar: number | null = null

  if (lastRowAtual?.data) {
    const lastStr = String(lastRowAtual.data).slice(0, 10) // 'YYYY-MM-DD'
    ultimaDataUsada = lastStr
    dadosAtrasados = lastStr !== fmt(endThis)

    // opcional: dias de atraso
    const parseYmd = (s: string) => {
      const [y, m, d] = s.split("-").map(Number)
      return new Date(y, m - 1, d)
    }
    const dLast = parseYmd(lastStr).getTime()
    const dToday = parseYmd(fmt(endThis)).getTime()
    diasSemAtualizar = Math.max(0, Math.round((dToday - dLast) / 86400000))
  }

  // mês atual quase sempre está incompleto
 

  return {
    mtdAtual,
    mtdPassado,
    deltaPct,
    avisos: {
      dadosAtrasados,
      ultimaDataUsada,
      diasSemAtualizar, // opcional, mas útil no UI
    },
  }
}