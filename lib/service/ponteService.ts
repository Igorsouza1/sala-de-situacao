import { findAllPonteData, findPonteDataByDateRange, insertPonteData } from "../repositories/ponteRepository";
import { createPonteSchema } from "../validations/ponte";
import Zod  from "zod"

interface MonthData {
    chuva: number
    nivel: number[]
    visibilidade: {
      cristalino: number
      turvo: number
      muitoTurvo: number
    }
  }

export async function getAllPonteData(){
    const ponteData = await findAllPonteData()

    const groupedData = ponteData.reduce(
        (acc, item) => {
          if (item.data) {
            const date = new Date(item.data)
            const year = date.getFullYear()
            const month = date.getMonth()
  
            if (!acc[year]) {
              acc[year] = Array(12)
                .fill(null)
                .map(
                  () =>
                    ({
                      chuva: 0,
                      nivel: [],
                      visibilidade: { cristalino: 0, turvo: 0, muitoTurvo: 0 },
                    }) as MonthData,
                )
            }
  
            if (item.chuva !== null) {
              acc[year][month].chuva += Number(item.chuva)
            }
  
            if (item.nivel !== null) {
              acc[year][month].nivel.push(Number(item.nivel))
            }
  
            if (item.visibilidade !== null) {
              switch (item.visibilidade.toLowerCase()) {
                case "cristalino":
                  acc[year][month].visibilidade.cristalino++
                  break
                case "turvo":
                  acc[year][month].visibilidade.turvo++
                  break
                case "muito turvo":
                  acc[year][month].visibilidade.muitoTurvo++
                  break
              }
            }
          }
  
          return acc
        },
        {} as Record<number, MonthData[]>,
      )
  
      // Calcular média do nível
      Object.values(groupedData).forEach((yearData) => {
        yearData.forEach((monthData) => {
          if (monthData.nivel.length > 0) {
            const avgNivel = monthData.nivel.reduce((sum, val) => sum + val, 0) / monthData.nivel.length
            monthData.nivel = [avgNivel]
          }
        })
      })

      return groupedData
}


export async function getPonteDataByDateRange(startDate: string, endDate: string){
  const dequeData = await findPonteDataByDateRange(startDate, endDate)
  return dequeData
}


type DequeInput = Zod.infer<typeof createPonteSchema>;

export async function createPonteData(input: DequeInput){
  const validatedData = createPonteSchema.parse(input);

  const mes = validatedData.data.toLocaleString('pt-BR', { month: 'long' });

  const completeData = {
    data: validatedData.data.toISOString().split('T')[0],
    local: "Ponte do Cure",
    mes: mes,

    chuva: validatedData.chuva.toString(),
    nivel: validatedData.nivel.toString(),
    visibilidade: validatedData.visibilidade.toString(),
  };

const newEntry = await insertPonteData(completeData);

return newEntry;
}


export async function getNivelRioComparativoPct() {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth(); // 0..11
  const day = today.getDate();

  // Faixa deste ano: 01/mês até hoje
  const startThis = new Date(year, month, 1);
  const endThis = today;

  // Faixa ano passado: 01/mesmo mês até mesmo dia (ajusta se não existir, tipo 30/02)
  const lastYear = year - 1;
  const lastDayOfMonth = new Date(lastYear, month + 1, 0).getDate();
  const endDay = Math.min(day, lastDayOfMonth);
  const startLast = new Date(lastYear, month, 1);
  const endLast = new Date(lastYear, month, endDay);

  const fmt = (d: Date) => d.toISOString().split("T")[0];

  const [rowsAtual, rowsPassado] = await Promise.all([
    getPonteDataByDateRange(fmt(startThis), fmt(endThis)),
    getPonteDataByDateRange(fmt(startLast), fmt(endLast)),
  ]);

  const mean = (rows: any[]) => {
    const vals = (rows ?? []).map(r => Number(r?.nivel)).filter(v => !isNaN(v));
    if (!vals.length) return null;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  };

  const mtdAtual = mean(rowsAtual);
  const mtdPassado = mean(rowsPassado);

  const deltaPct =
    mtdAtual !== null && mtdPassado
      ? ((mtdAtual - mtdPassado) / mtdPassado) * 100
      : null;

  return { mtdAtual, mtdPassado, deltaPct };
}