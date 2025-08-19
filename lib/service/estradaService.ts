import Zod  from "zod"
import { createEstradaSchema } from "../validations/estrada";
import { insertEstradaData } from "../repositories/estradasRepository";
import { extractTrackAsWKT } from "../helpers/gpxParser";



type EstradaInput = Zod.infer<typeof createEstradaSchema>;


export async function createDequeData(input: EstradaInput){
    const validatedData = createEstradaSchema.parse(input);

    const geometry = extractTrackAsWKT(validatedData.geom);

    const completeData = {
      nome: validatedData.nome.toString(),
      tipo: validatedData.tipo.toString(),
      codigo: validatedData.codigo || null,
      geom: geometry
    };

  const newEntry = await insertEstradaData(completeData);

  return newEntry;
}