import { apiError } from "@/lib/api/responses";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import { rawFirmsInMonitoramento } from "@/db/schema";
import { revalidateTag } from "next/cache";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const params = await context.params;
        const regionId = parseInt(params.id, 10);
        if (isNaN(regionId)) return apiError("ID da região inválido.", 400);

        const formData = await request.formData().catch(() => null);
        if (!formData) return apiError("FormData é obrigatório.", 400);

        const file = formData.get("file") as File;
        if (!file) return apiError("Arquivo é obrigatório.", 400);

        const fileContent = await file.text();
        const parsedGeoJson = JSON.parse(fileContent);

        let features: any[] = [];
        if (parsedGeoJson.type === "FeatureCollection") {
            features = parsedGeoJson.features;
        } else if (parsedGeoJson.type === "Feature") {
            features = [parsedGeoJson];
        } else {
            return apiError("Formato GeoJSON inválido. Esperado FeatureCollection ou Feature.", 400);
        }

        const totalFeatures = features.length;

        const stream = new ReadableStream({
            async start(controller) {
                let insertedCount = 0;
                let skippedCount = 0;

                const sendProgress = () => {
                    const payload = JSON.stringify({
                        type: "progress",
                        data: {
                            inserted: insertedCount,
                            skipped: skippedCount,
                            total: totalFeatures,
                            current: insertedCount + skippedCount,
                        },
                    }) + "\n";
                    try {
                        controller.enqueue(new TextEncoder().encode(payload));
                    } catch (e) {}
                };

                try {
                    sendProgress();

                    for (let i = 0; i < totalFeatures; i++) {
                        const feature = features[i];
                        const props = feature.properties || {};

                        // Extrair lat/lon da geometria (ponto) ou das propriedades
                        let latitude: number | null = null;
                        let longitude: number | null = null;

                        if (feature.geometry?.type === "Point" && Array.isArray(feature.geometry.coordinates)) {
                            longitude = feature.geometry.coordinates[0];
                            latitude = feature.geometry.coordinates[1];
                        }

                        // Fallback para propriedades
                        if (latitude == null) latitude = props.latitude != null ? parseFloat(props.latitude) : null;
                        if (longitude == null) longitude = props.longitude != null ? parseFloat(props.longitude) : null;

                        const acqDate: string | null = props.acq_date || null;

                        if (latitude == null || longitude == null || !acqDate) {
                            skippedCount++;
                            if (i % 10 === 0) sendProgress();
                            continue;
                        }

                        // Deduplicação: mesma data + latitude + longitude
                        const duplicateCheck = await db.execute(sql`
                            SELECT id FROM monitoramento.raw_firms
                            WHERE acq_date = ${acqDate}::date
                              AND latitude = ${latitude}
                              AND longitude = ${longitude}
                            LIMIT 1
                        `);

                        if (duplicateCheck.rowCount && duplicateCheck.rowCount > 0) {
                            skippedCount++;
                        } else {
                            const acqTime: string | null = props.acq_time ? String(props.acq_time) : null;
                            const brightTi4 = props.bright_ti4 != null ? parseFloat(props.bright_ti4) : null;
                            const scan = props.scan != null ? parseFloat(props.scan) : null;
                            const track = props.track != null ? parseFloat(props.track) : null;
                            const satellite: string | null = props.satellite || null;
                            const instrument: string | null = props.instrument || null;
                            const confidence: string | null = props.confidence != null ? String(props.confidence) : null;
                            const version: string | null = props.version || null;
                            const brightTi5 = props.bright_ti5 != null ? parseFloat(props.bright_ti5) : null;
                            const frp = props.frp != null ? parseFloat(props.frp) : null;
                            const daynight: string | null = props.daynight || null;
                            const type: string | null = props.type != null ? String(props.type) : null;

                            const geomSql = sql`ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4674)`;

                            await db.insert(rawFirmsInMonitoramento).values({
                                latitude,
                                longitude,
                                acqDate,
                                acqTime,
                                brightTi4: isNaN(brightTi4 as number) ? null : brightTi4,
                                scan: isNaN(scan as number) ? null : scan,
                                track: isNaN(track as number) ? null : track,
                                satellite,
                                instrument,
                                confidence,
                                version,
                                brightTi5: isNaN(brightTi5 as number) ? null : brightTi5,
                                frp: isNaN(frp as number) ? null : frp,
                                daynight,
                                type,
                                geom: geomSql,
                                regiaoId: regionId,
                                alertaEnviado: false,
                            });

                            insertedCount++;
                        }

                        if (i > 0 && i % 10 === 0) {
                            sendProgress();
                        }
                    }

                    revalidateTag(`focos-${regionId}`);

                    const finalPayload = JSON.stringify({
                        type: "complete",
                        data: { inserted: insertedCount, skipped: skippedCount },
                    }) + "\n";
                    controller.enqueue(new TextEncoder().encode(finalPayload));
                    controller.close();

                } catch (dbError) {
                    console.error("DB Error processing focos stream", dbError);
                    const errorPayload = JSON.stringify({
                        type: "error",
                        message: dbError instanceof Error ? dbError.message : "Erro desconhecido no processamento",
                    }) + "\n";
                    try {
                        controller.enqueue(new TextEncoder().encode(errorPayload));
                        controller.close();
                    } catch (e) {}
                }
            },
        });

        return new Response(stream, {
            headers: {
                "Content-Type": "application/x-ndjson",
                "Cache-Control": "no-cache",
                Connection: "keep-alive",
            },
        });

    } catch (error) {
        console.error("Failed to prepare focos commit", error);
        return apiError("Falha ao salvar os focos de incêndio.", 500);
    }
}
