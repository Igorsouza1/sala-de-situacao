import { z } from "zod";

export const orgRoleEnum = z.enum(["owner", "editor", "viewer", "auditor"]);
export type OrgRole = z.infer<typeof orgRoleEnum>;

export const createUserAccessSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email inválido."),
  tenantId: z.string().uuid("Organização inválida."),
  role: orgRoleEnum,
  // Vazio/omitido = acesso à organização toda (sem restringir região).
  regionIds: z.array(z.number().int().positive()).optional().default([]),
});

export const updateUserAccessSchema = z.object({
  role: orgRoleEnum,
  regionId: z.number().int().positive().nullable(),
});

export type CreateUserAccessPayload = z.infer<typeof createUserAccessSchema>;
export type UpdateUserAccessPayload = z.infer<typeof updateUserAccessSchema>;
