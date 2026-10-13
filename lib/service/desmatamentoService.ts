import { findAllDesmatamentoData } from "../repositories/desmatamentoReposiroty"



export async function getAllDesmatamentoDataGroupedByMonthAndYear(tenantId: string, isSuperadmin: boolean, regiaoIds?: number | number[], year?: number){
    const desmatamentoData = await findAllDesmatamentoData(tenantId, isSuperadmin, regiaoIds, year)

    // Agrupar os dados por mês e ano
    const groupedData = desmatamentoData.reduce(
        (acc, item) => {
          if (item.detectat) {
            const date = new Date(item.detectat)
            const year = date.getUTCFullYear()
            const month = date.getUTCMonth()
  
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
