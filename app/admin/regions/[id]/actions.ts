"use server";

import { updateRegionMetadata } from "@/lib/service/adminService";
import { getProperties, processPropertiesGeoJSON, removeProperty } from "@/lib/service/propriedadeService";
import { revalidatePath } from "next/cache";

export async function saveRegionMetadata(id: number, data: { nome: string; organizationId: string }) {
    await updateRegionMetadata(id, data);
    revalidatePath("/admin");
    revalidatePath("/admin/regions");
    revalidatePath(`/admin/regions/${id}`);
    return { success: true };
}

export async function fetchPropertiesAction(regiaoId: number) {
    return await getProperties(regiaoId);
}

export async function uploadPropertiesAction(regiaoId: number, geojson: any) {
    const result = await processPropertiesGeoJSON(regiaoId, geojson);
    revalidatePath(`/admin/regions/${regiaoId}`);
    return result;
}

export async function deletePropertyAction(regiaoId: number, propertyId: number) {
    await removeProperty(propertyId);
    revalidatePath(`/admin/regions/${regiaoId}`);
    return { success: true };
}
