import { NextResponse } from "next/server";
import { db } from "@/db";
import { acoesInMonitoramento } from "@/db/schema";
import { eq, isNotNull, and } from "drizzle-orm";
import { apiError, apiSuccess } from "@/lib/api/responses";

export async function GET() {
  try {
    const data = await db
      .select({
        latitude: acoesInMonitoramento.latitude,
        longitude: acoesInMonitoramento.longitude,
      })
      .from(acoesInMonitoramento)
      .where(
        and(
          eq(acoesInMonitoramento.tipoTecnico, "Fauna Exótica"),
          isNotNull(acoesInMonitoramento.latitude),
          isNotNull(acoesInMonitoramento.longitude)
        )
      );

    // Filter out rows with invalid or missing coordinates
    // Map data to the format leaflet.heat expects: [lat, lng, intensity]
    const heatData = data
      .filter(row => row.latitude !== null && row.longitude !== null)
      .map((row) => [
        parseFloat(row.latitude as string),
        parseFloat(row.longitude as string),
        1 // Default intensity
      ]);

    return apiSuccess(heatData);
  } catch (error) {
    console.error("Error fetching fauna exotica heatmap data:", error);
    return apiError(
      "Falha ao buscar dados do mapa de calor de Fauna Exótica.",
      500
    );
  }
}
