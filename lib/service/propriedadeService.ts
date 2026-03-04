import { checkDuplicateProperty, insertPropriedade, findPropertiesByRegion, deletePropriedade } from "@/lib/repositories/propriedadesRepository";

export async function getProperties(regiaoId: number) {
  return findPropertiesByRegion(regiaoId);
}

export async function removeProperty(id: number) {
  return deletePropriedade(id);
}

export async function processPropertiesGeoJSON(regiaoId: number, geojson: any) {
  if (!geojson || geojson.type !== "FeatureCollection") {
    throw new Error("Invalid GeoJSON: Expected FeatureCollection");
  }

  let insertedCount = 0;
  let skippedCount = 0;

  for (const feature of geojson.features) {
    if (feature.geometry.type !== "Polygon" && feature.geometry.type !== "MultiPolygon") {
      skippedCount++;
      continue;
    }

    const geometryStr = JSON.stringify(feature.geometry);
    const isDuplicate = await checkDuplicateProperty(geometryStr, regiaoId);

    if (isDuplicate) {
      skippedCount++;
      continue;
    }

    const props = feature.properties || {};

    await insertPropriedade({
      regiaoId,
      geojson: geometryStr,
      nome: props.nome || props.NOM_IMOVEL || props.NOME_IMOVEL,
      cod_tema: props.cod_tema || props.COD_TEMA,
      nom_tema: props.nom_tema || props.NOM_TEMA,
      cod_imovel: props.cod_imovel || props.COD_IMOVEL,
      mod_fiscal: props.mod_fiscal || props.MOD_FISCAL,
      num_area: props.num_area || props.NUM_AREA,
      ind_status: props.ind_status || props.IND_STATUS,
      ind_tipo: props.ind_tipo || props.IND_TIPO,
      des_condic: props.des_condic || props.DES_CONDIC,
      municipio: props.municipio || props.MUNICIPIO,
      properties: props
    });

    insertedCount++;
  }

  return {
    insertedCount,
    skippedCount,
    totalCount: geojson.features.length
  };
}
