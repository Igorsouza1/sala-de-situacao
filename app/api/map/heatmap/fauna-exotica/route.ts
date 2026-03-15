import { NextResponse } from "next/server";
import { db } from "@/db";
import { acoesInMonitoramento, javaliAvistamentosInMonitoramento } from "@/db/schema";
import { eq, isNotNull, and, sql } from "drizzle-orm";
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
    const acoesHeatData = data
      .filter(row => row.latitude !== null && row.longitude !== null)
      .map((row) => [
        parseFloat(row.latitude as string),
        parseFloat(row.longitude as string),
        1 // Default intensity
      ]);

    const avistamentosData = await db
      .select({
        latitude: sql<number>`ST_Y(${javaliAvistamentosInMonitoramento.geom}::geometry)`,
        longitude: sql<number>`ST_X(${javaliAvistamentosInMonitoramento.geom}::geometry)`,
      })
      .from(javaliAvistamentosInMonitoramento);

    const avistamentosHeatData = avistamentosData
      .filter(row => row.latitude !== null && row.longitude !== null)
      .map((row) => [
        row.latitude,
        row.longitude,
        1
      ]);

    const combinedData = [...acoesHeatData, ...avistamentosHeatData];

    return apiSuccess(combinedData);
  } catch (error) {
    console.error("Error fetching fauna exotica heatmap data:", error);
    return apiError(
      "Falha ao buscar dados do mapa de calor de Fauna Exótica.",
      500
    );
  }
}
