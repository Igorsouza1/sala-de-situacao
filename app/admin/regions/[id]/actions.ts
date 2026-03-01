"use server";

import { updateRegionMetadata } from "@/lib/service/adminService";
import { revalidatePath } from "next/cache";

export async function saveRegionMetadata(id: number, data: { nome: string; organizationId: string }) {
    await updateRegionMetadata(id, data);
    revalidatePath("/admin");
    revalidatePath("/admin/regions");
    revalidatePath(`/admin/regions/${id}`);
    return { success: true };
}
