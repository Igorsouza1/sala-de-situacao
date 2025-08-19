import { z } from "zod";


export const createPonteSchema = z.object({
    data: z.coerce.date({
        error: () => ({ message: "Por favor, insira uma data válida." }),
      }),
      chuva: z.coerce.number().min(0, {
        message: "O valor da chuva não pode ser negativo.",
      }),
      nivel: z.coerce.number().min(0, {
        message: "O valor da chuva não pode ser negativo.",
      }),
      visibilidade: z.enum(['Cristalino', 'Turvo', 'Muito Turvo'])
})