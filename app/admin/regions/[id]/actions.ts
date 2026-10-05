"use server";

import { updateRegionMetadata } from "@/lib/service/adminService";
import { requireSuperadmin } from "@/lib/api/require-auth";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const payloadSchema = z.object({
    id: z.number().int().safe().positive(),
    data: z.object({
        nome: z.string().trim().min(1).max(255),
        organizationId: z.string().uuid(),
    }),
});

export async function saveRegionMetadata(id: number, data: { nome: string; organizationId: string }) {
    const { response } = await requireSuperadmin();
    if (response) throw new Error("Acesso negado.");
    const parsed = payloadSchema.safeParse({ id, data });
    if (!parsed.success) throw new Error("Dados da regiao invalidos.");
    await updateRegionMetadata(parsed.data.id, parsed.data.data);
    revalidatePath("/admin");
    revalidatePath("/admin/regions");
    revalidatePath(`/admin/regions/${id}`);
    return { success: true };
}
