import { dequeDePedrasInRioDaPrata } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";


export const  criar = (d: { local: string; mes: string; data: string; turbidez: string; secchiVertical: string; secchiHorizontal: string; chuva: string; }) =>
    db.insert(dequeDePedrasInRioDaPrata).values({
        local: "Deque de Pedras",
        mes: d.mes,
        data: d.data,
        turbidez: d.turbidez,
        secchiVertical: d.secchiVertical,
        secchiHorizontal: d.secchiHorizontal,
        chuva: d.chuva,
  }).returning().then(r => r[0]);

export const listar = () => db.select().from(dequeDePedrasInRioDaPrata);

export const editar = (id: number, d: { local: string; mes: string; data: string; turbidez: string; secchiVertical: string; secchiHorizontal: string; chuva: string; }) => {
  db.update(dequeDePedrasInRioDaPrata).set({
    local: d.local,
    mes: d.mes,
    data: d.data,
    turbidez: d.turbidez,
    secchiVertical: d.secchiVertical,
    secchiHorizontal: d.secchiHorizontal,
    chuva: d.chuva,
  })
}


export const remover = (id: number) =>
  db.delete(dequeDePedrasInRioDaPrata).where(eq(dequeDePedrasInRioDaPrata.id, id));

