import { z } from "zod";

export const organizationPayloadSchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório.").max(255),
  maxRegions: z.coerce.number().int().min(1, "Limite deve ser >= 1."),
});

export const organizationIdSchema = z.object({
  id: z.string().uuid("ID de organização inválido."),
});

export const regionPayloadSchema = z.object({
  nome: z.string().trim().min(1, "Nome da região é obrigatório.").max(255),
  organizationId: z.string().uuid("Organização inválida."),
  geometry: z.object({
    type: z.literal("Polygon"),
    coordinates: z.array(z.array(z.tuple([z.coerce.number(), z.coerce.number()])).min(4)).min(1),
  }),
});

export const regionIdSchema = z.object({
  id: z.coerce.number().int().positive("ID de região inválido."),
});

export type OrganizationPayload = z.infer<typeof organizationPayloadSchema>;
export type RegionPayload = z.infer<typeof regionPayloadSchema>;
