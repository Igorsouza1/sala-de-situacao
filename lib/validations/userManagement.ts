import { z } from "zod";

export const orgRoleEnum = z.enum(["owner", "editor", "viewer", "auditor"]);
export type OrgRole = z.infer<typeof orgRoleEnum>;

export const createUserAccessSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email inválido."),
  tenantId: z.string().uuid("Organização inválida."),
  role: orgRoleEnum,
  // Apenas Owner possui acesso à organização inteira sem região específica.
  regionIds: z.array(z.number().int().positive()).optional().default([]),
}).superRefine((data, ctx) => {
  if (data.role !== "owner" && data.regionIds.length === 0) {
    ctx.addIssue({ code: "custom", path: ["regionIds"], message: "Selecione ao menos uma região para este papel." });
  }
  if (data.role === "owner" && data.regionIds.length > 0) {
    ctx.addIssue({ code: "custom", path: ["regionIds"], message: "Owner já acessa todas as regiões da organização." });
  }
});

export const updateUserAccessSchema = z.object({
  role: orgRoleEnum,
  regionId: z.number().int().positive().nullable(),
}).superRefine((data, ctx) => {
  if (data.role !== "owner" && data.regionId === null) {
    ctx.addIssue({ code: "custom", path: ["regionId"], message: "Selecione uma região para este papel." });
  }
  if (data.role === "owner" && data.regionId !== null) {
    ctx.addIssue({ code: "custom", path: ["regionId"], message: "Owner já acessa todas as regiões da organização." });
  }
});

export type CreateUserAccessPayload = z.infer<typeof createUserAccessSchema>;
export type UpdateUserAccessPayload = z.infer<typeof updateUserAccessSchema>;
