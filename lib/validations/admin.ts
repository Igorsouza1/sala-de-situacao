import { z } from "zod";

export const organizationPayloadSchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório.").max(255),
  maxRegions: z.coerce.number().int().min(1, "Limite deve ser >= 1."),
  slug: z
    .string()
    .trim()
    .min(2, "Slug deve ter pelo menos 2 caracteres.")
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Slug: apenas letras minúsculas, números e hífens.")
    .optional()
    .nullable(),
});

export const organizationIdSchema = z.object({
  id: z.string().uuid("ID de organização inválido."),
});

const geometrySchema = z.union([
  z.object({ type: z.literal("Polygon"),      coordinates: z.array(z.unknown()).min(1) }),
  z.object({ type: z.literal("MultiPolygon"), coordinates: z.array(z.unknown()).min(1) }),
]);

export const regionPayloadSchema = z.object({
  nome:           z.string().trim().min(1, "Nome da região é obrigatório.").max(255),
  descricao:      z.string().trim().max(1000).optional().nullable(),
  organizationId: z.string().uuid("Organização inválida."),
  geometry:       geometrySchema.optional().nullable(),
});

export const regionIdSchema = z.object({
  id: z.coerce.number().int().positive("ID de região inválido."),
});

export type OrganizationPayload = z.infer<typeof organizationPayloadSchema>;
export type RegionPayload    = z.infer<typeof regionPayloadSchema>;
