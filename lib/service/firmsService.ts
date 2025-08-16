import { findAllFirmsData } from "../repositories/firmsRepository"




export async function getAllFirmsData(){
    const result = await findAllFirmsData()

    const groupedData = result.reduce(
        (acc, item) => {
          if (item.acq_date) {
            const date = new Date(item.acq_date)
            const year = date.getFullYear()
            const month = date.getMonth()
  
            if (!acc[year]) {
              acc[year] = Array(12).fill(0)
            }
  
            acc[year][month]++
          }
          return acc
        },
        {} as Record<number, number[]>,
      )
  

    return groupedData
}




