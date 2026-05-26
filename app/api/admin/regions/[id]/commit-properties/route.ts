export const maxDuration = 60;

import { requireAuth } from "@/lib/api/require-auth";
import { apiError } from "@/lib/api/responses";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import { revalidateTag } from "next/cache";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { response: authResponse } = await requireAuth();
        if (authResponse) return authResponse;

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

                    // Resolve tenant_id a partir da região
                    const tenantRow = await db.execute(sql`
                        SELECT metadata->>'organizationId' AS tenant_id
                        FROM monitoramento.regioes WHERE id = ${regionId} LIMIT 1
                    `);
                    const tenantId: string | null = (tenantRow.rows[0] as any)?.tenant_id ?? null;
                    if (!tenantId) throw new Error(`Região ${regionId} não possui organizationId no metadata.`);

                    for (let i = 0; i < totalFeatures; i++) {
                        const feature = features[i];
                        const coords = feature.geometry?.coordinates;
                        if (!feature.geometry || !coords || coords.length === 0) {
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

                            const propsJson = JSON.stringify(props);
                            await db.execute(sql`
                                INSERT INTO monitoramento.propriedades
                                  (cod_tema, nom_tema, cod_imovel, mod_fiscal, num_area,
                                   ind_status, ind_tipo, des_condic, municipio,
                                   geom, nome, regiao_id, properties, tenant_id)
                                VALUES
                                  (${codTema}, ${nomTema}, ${codImovel},
                                   ${isNaN(modFiscal as number) ? null : modFiscal},
                                   ${isNaN(numArea as number) ? null : numArea},
                                   ${indStatus}, ${indTipo}, ${desCondic}, ${municipio},
                                   ${geomSql}, ${nome}, ${regionId}, ${propsJson}::jsonb,
                                   ${tenantId}::uuid)
                            `);

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
                    const pgCode = (dbError as any)?.code ?? '';
                    const pgDetail = (dbError as any)?.detail ?? '';
                    const baseMsg = dbError instanceof Error ? dbError.message : "Erro desconhecido no processamento";
                    const fullMsg = [baseMsg, pgCode && `code=${pgCode}`, pgDetail].filter(Boolean).join(' | ');
                    const errorPayload = JSON.stringify({
                        type: 'error',
                        message: fullMsg
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
