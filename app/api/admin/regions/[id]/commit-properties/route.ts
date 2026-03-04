import { apiError, apiSuccess } from "@/lib/api/responses";
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

    let insertedCount = 0;
    let skippedCount = 0;

    for (const feature of features) {
        if (!feature.geometry) continue;

        const props = feature.properties || {};

        // Define geometry for insertion/checking
        const geomSql = sql`ST_SetSRID(ST_GeomFromGeoJSON(${JSON.stringify(feature.geometry)}), 4674)`;

        // Check for duplicates using ST_Equals in the same region
        const duplicateCheck = await db.execute(sql`
            SELECT id FROM monitoramento.propriedades
            WHERE regiao_id = ${regionId}
            AND ST_Equals(geom, ${geomSql})
            LIMIT 1
        `);

        if (duplicateCheck.rowCount && duplicateCheck.rowCount > 0) {
            skippedCount++;
            continue; // Skip insertion
        }

        // Map properties to columns
        const codTema = props.cod_tema || null;
        const nomTema = props.nom_tema || null;
        const codImovel = props.cod_imovel || null;
        const modFiscal = props.mod_fiscal ? parseFloat(props.mod_fiscal) : null;
        const numArea = props.num_area ? parseFloat(props.num_area) : null;
        const indStatus = props.ind_status || null;
        const indTipo = props.ind_tipo || null;
        const desCondic = props.des_condic || null;
        const municipio = props.municipio || null;
        const nome = props.nome || null; // Might not exist in default standard, but good to check

        // Insert
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

    revalidateTag(`properties-${regionId}`);

    return apiSuccess({
        message: "Operação concluída.",
        data: { inserted: insertedCount, skipped: skippedCount }
    });

  } catch (error) {
    console.error("Failed to commit properties", error);
    return apiError("Falha ao salvar as propriedades.", 500);
  }
}
