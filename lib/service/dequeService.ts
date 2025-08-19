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