import { z } from "zod";

export const createBalnearioSchema = z.object({
  data: z.coerce.date({
    error: () => ({ message: "Por favor, insira uma data válida." }),
  }),
  turbidez: z.coerce.number().min(0).optional().nullable(),
  secchiVertical: z.coerce.number().min(0).optional().nullable(),
  nivelAgua: z.coerce.number().min(0).optional().nullable(),
  pluviometria: z.coerce.number().min(0).optional().nullable(),
  observacao: z.string().optional().nullable(),
});

export type BalnearioInput = z.infer<typeof createBalnearioSchema>;
