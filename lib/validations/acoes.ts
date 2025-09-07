import { z } from "zod";

export const trilhaSchema = z.object({
  nome: z.string().min(1),
  geom: z.string().min(1),
  dataInicio: z.string().nullable().optional(),
  dataFim: z.string().nullable().optional(),
  duracaoMinutos: z.coerce.number().int().nullable().optional(),
});

export const waypointSchema = z.object({
  tempId: z.string().optional(),
  name: z.string().nullable().optional(),
  descricao: z.string().nullable().optional(),
  acao: z.string().nullable().optional(),
  latitude: z.coerce.number(),
  longitude: z.coerce.number(),
  elevation: z.coerce.number().nullable().optional(),
  time: z.string().nullable().optional(),
  mes: z.string().min(1),
  atuacao: z.string().min(1),
});

export const createAcoesSchema = z.object({
  trilha: trilhaSchema,
  waypoints: z.array(waypointSchema).min(1),
});

export type TrilhaInput = z.infer<typeof trilhaSchema>;
export type WaypointInput = z.infer<typeof waypointSchema>;
export type CreateAcoesInput = z.infer<typeof createAcoesSchema>;