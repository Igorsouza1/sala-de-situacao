
import { z } from "zod";

export const createEstradaSchema = z.object({
  nome: z.string().min(1, "O nome é Obrigatório"),
  tipo: z.enum(["Pavimentada", "Implantada", "Não Pavimentada"], "Tipo de Estrada inválido"),
  codigo: z.string().optional(),
  geom: z.object({
    type: z.literal("FeatureCollection"),
    features: z.array(z.any()), // Apenas garantimos que 'features' é um array
  }).refine(data => data.features.length > 0, {
    message: "O arquivo GPX deve conter pelo menos uma trilha (feature).",
  })
});


export type EstradaInput = z.infer<typeof createEstradaSchema>;