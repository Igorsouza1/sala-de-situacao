import { z } from "zod";

export const orgRoleEnum = z.enum(["owner", "editor", "viewer", "auditor"]);
export type OrgRole = z.infer<typeof orgRoleEnum>;

// Owner recebe uma Organização inteira (tenantId). Os demais recebem Regiões, que podem ser de Organizações diferentes: o
// servidor descobre a Organização de cada Região e cria um papel em cada uma (tenantId, se vier, não é usado).
export const createUserAccessSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email inválido."),
  tenantId: z.string().uuid("Organização inválida.").optional(),
  role: orgRoleEnum,
  regionIds: z.array(z.number().int().positive()).optional().default([]),
}).superRefine((data, ctx) => {
  if (data.role !== "owner" && data.regionIds.length === 0) {
    ctx.addIssue({ code: "custom", path: ["regionIds"], message: "Selecione ao menos uma região para este papel." });
  }
  if (data.role === "owner" && data.regionIds.length > 0) {
    ctx.addIssue({ code: "custom", path: ["regionIds"], message: "Owner já acessa todas as regiões da organização." });
  }
  if (data.role === "owner" && !data.tenantId) {
    ctx.addIssue({ code: "custom", path: ["tenantId"], message: "Escolha a organização deste owner." });
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
