import { findAllBalnearioData, findBalnearioDataByDateRange, insertBalnearioData } from "../repositories/balnearioRepository"
import { createBalnearioSchema } from "../validations/balneario"
import Zod from "zod"

interface MonthData {
  pluviometria: number
  turbidez: number[]
  turbidezMax?: number
  turbidezMin?: number
  turbidezMedia?: number
  nivelAgua: number[]
  nivelAguaMedia?: number
}

export async function getAllBalnearioDataGroupedByMonth() {
  const data = await findAllBalnearioData()

  const groupedData = data.reduce(
    (acc, item) => {
      if (item.data) {
        const date = new Date(item.data)
        const year = date.getFullYear()
        const month = date.getMonth()

        if (!acc[year]) {
          acc[year] = Array(12)
            .fill(null)
            .map(() => ({ pluviometria: 0, turbidez: [], nivelAgua: [] }))
        }

        acc[year][month].pluviometria += Number(item.pluviometria) || 0

        if (item.turbidez !== null && item.turbidez !== undefined) {
          acc[year][month].turbidez.push(Number(item.turbidez))
        }

        if (item.nivelAgua !== null && item.nivelAgua !== undefined) {
          acc[year][month].nivelAgua.push(Number(item.nivelAgua))
        }
      }

      return acc
    },
    {} as Record<number, MonthData[]>,
  )

  Object.values(groupedData).forEach((yearData) => {
    yearData.forEach((monthData) => {
      if (monthData.turbidez.length > 0) {
        monthData.turbidezMax = Math.max(...monthData.turbidez)
        monthData.turbidezMin = Math.min(...monthData.turbidez)
        monthData.turbidezMedia =
          monthData.turbidez.reduce((sum, val) => sum + val, 0) / monthData.turbidez.length
      }

      if (monthData.nivelAgua.length > 0) {
        monthData.nivelAguaMedia =
          monthData.nivelAgua.reduce((sum, val) => sum + val, 0) / monthData.nivelAgua.length
      }
    })
  })

  return groupedData
}

export async function getBalnearioDataByDateRange(startDate: string, endDate: string) {
  return findBalnearioDataByDateRange(startDate, endDate)
}

type BalnearioInput = Zod.infer<typeof createBalnearioSchema>;

export async function createBalnearioData(input: BalnearioInput) {
  const validatedData = createBalnearioSchema.parse(input)

  const mes = validatedData.data.toLocaleString("pt-BR", { month: "long" })

  const completeData = {
    data: validatedData.data.toISOString().split("T")[0],
    local: "Balneário Municipal",
    mes,
    turbidez: validatedData.turbidez != null ? validatedData.turbidez.toString() : null,
    secchiVertical: validatedData.secchiVertical != null ? validatedData.secchiVertical.toString() : null,
    nivelAgua: validatedData.nivelAgua != null ? validatedData.nivelAgua.toString() : null,
    pluviometria: validatedData.pluviometria != null ? validatedData.pluviometria.toString() : null,
    observacao: validatedData.observacao ?? null,
  }

  return insertBalnearioData(completeData)
}
