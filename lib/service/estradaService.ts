import Zod  from "zod"
import { createEstradaSchema } from "../validations/estrada";
import { insertEstradaData } from "../repositories/estradasRepository";
import { extractTrackAsWKT } from "../helpers/gpxParser";
import { type NewEstradaData } from '@/db/schema';

type EstradaInput = Zod.infer<typeof createEstradaSchema>;


export async function createEstradaData(input: EstradaInput, tenantId: string, regiaoId: number | null){
    const validatedData = createEstradaSchema.parse(input);

    const geometry = extractTrackAsWKT(validatedData.geometry);

    const completeData: NewEstradaData = {
      nome: validatedData.nome.toString(),
      tipo: validatedData.tipo.toString(),
      codigo: validatedData.codigo || null,
      tenantId,
      regiaoId,
      geom: geometry
    };

  const newEntry = await insertEstradaData(completeData);

  return newEntry;
}
