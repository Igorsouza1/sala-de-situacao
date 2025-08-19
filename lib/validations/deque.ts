
import { z } from "zod";

export const createDequeSchema = z.object({
  data: z.coerce.date({
    error: () => ({ message: "Por favor, insira uma data válida." }),
  }),
  turbidez: z.coerce.number().min(0, {
    message: "O valor da turbidez não pode ser negativo.",
  }),
  secchiVertical: z.coerce.number().min(0, {
    message: "O valor do Secchi Vertical não pode ser negativo.",
  }),
  secchiHorizontal: z.coerce.number().min(0, {
    message: "O valor do Secchi Horizontal não pode ser negativo.",
  }),
  chuva: z.coerce.number().min(0, {
    message: "O valor da chuva não pode ser negativo.",
  }),
});


export type DequeInput = z.infer<typeof createDequeSchema>;