import { findAllDesmatamentoData } from "../repositories/desmatamentoReposiroty"



export async function getAllDesmatamentoDataGroupedByMonthAndYear(regiaoId: number){
    const desmatamentoData = await findAllDesmatamentoData(regiaoId)

    // Agrupar os dados por mês e ano
    const groupedData = desmatamentoData.reduce(
        (acc, item) => {
          if (item.detectat) {
            const date = new Date(item.detectat)
            const year = date.getFullYear()
            const month = date.getMonth()
  
            if (!acc[year]) {
              acc[year] = Array(12).fill(0)
            }
  
            acc[year][month] += Number(item.alertha) || 0
          }
          return acc
        },
        {} as Record<number, number[]>,
      )

    return groupedData
}