import { findAllPropertiesStats } from "@/lib/repositories/propriedadesRepository";

export async function getPropertiesSummary() {
    try {
        const data = await findAllPropertiesStats();
        return data;
    } catch (error) {
        console.error("Error fetching properties summary:", error);
        throw new Error("Failed to fetch properties summary");
    }
}
