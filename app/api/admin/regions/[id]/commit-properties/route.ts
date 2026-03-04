import { apiError } from "@/lib/api/responses";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import { propriedadesInMonitoramento } from "@/db/schema";
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

        let features = [];
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
                        type: 'progress',
                        data: {
                            inserted: insertedCount,
                            skipped: skippedCount,
                            total: totalFeatures,
                            current: insertedCount + skippedCount
                        }
                    }) + '\n';
                    try {
                        controller.enqueue(new TextEncoder().encode(payload));
                    } catch (e) { }
                };

                try {
                    sendProgress();

                    for (let i = 0; i < totalFeatures; i++) {
                        const feature = features[i];
                        if (!feature.geometry) {
                            skippedCount++;
                            if (i % 10 === 0) sendProgress();
                            continue;
                        }

                        const props = feature.properties || {};
                        const geomSql = sql`ST_SetSRID(ST_GeomFromGeoJSON(${JSON.stringify(feature.geometry)}), 4674)`;

                        const duplicateCheck = await db.execute(sql`
                    SELECT id FROM monitoramento.propriedades
                    WHERE regiao_id = ${regionId}
                    AND ST_Equals(geom, ${geomSql})
                    LIMIT 1
                `);

                        if (duplicateCheck.rowCount && duplicateCheck.rowCount > 0) {
                            skippedCount++;
                        } else {
                            const codTema = props.cod_tema || null;
                            const nomTema = props.nom_tema || null;
                            const codImovel = props.cod_imovel || null;
                            const modFiscal = props.mod_fiscal ? parseFloat(props.mod_fiscal) : null;
                            const numArea = props.num_area ? parseFloat(props.num_area) : null;
                            const indStatus = props.ind_status || null;
                            const indTipo = props.ind_tipo || null;
                            const desCondic = props.des_condic || null;
                            const municipio = props.municipio || null;
                            const nome = props.nome || null;

                            await db.insert(propriedadesInMonitoramento).values({
                                regiaoId: regionId,
                                geom: geomSql,
                                codTema,
                                nomTema,
                                codImovel,
                                modFiscal: isNaN(modFiscal as number) ? null : modFiscal,
                                numArea: isNaN(numArea as number) ? null : numArea,
                                indStatus,
                                indTipo,
                                desCondic,
                                municipio,
                                nome,
                                properties: props
                            });

                            insertedCount++;
                        }

                        // Emite progresso de tanto em tanto (lote de 10 reduz travamentos na transmissão)
                        if (i > 0 && i % 10 === 0) {
                            sendProgress();
                        }
                    }

                    revalidateTag(`properties-${regionId}`);

                    const finalPayload = JSON.stringify({
                        type: 'complete',
                        data: { inserted: insertedCount, skipped: skippedCount }
                    }) + '\n';
                    controller.enqueue(new TextEncoder().encode(finalPayload));
                    controller.close();

                } catch (dbError) {
                    console.error("DB Error processing properties stream", dbError);
                    const errorPayload = JSON.stringify({
                        type: 'error',
                        message: dbError instanceof Error ? dbError.message : "Erro desconhecido no processamento"
                    }) + '\n';
                    try {
                        controller.enqueue(new TextEncoder().encode(errorPayload));
                        controller.close();
                    } catch (e) { }
                }
            }
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'application/x-ndjson',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive'
            }
        });

    } catch (error) {
        console.error("Failed to prepare properties commit", error);
        return apiError("Falha ao salvar as propriedades.", 500);
    }
}
