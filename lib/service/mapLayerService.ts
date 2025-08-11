import { findAllMapLayersData } from "../repositories/mapLayerRepository";



export async function getAllMapLayersData(){
    const { estradas, bacia_rio_da_prata, leito_rio_da_prata, desmatamento, propriedades, firms, banhado_rio_da_prata } = await findAllMapLayersData();

    // Função para converter um conjunto de dados para GeoJSON
    const convertToGeoJSON = (rows: any[], properties: string[]) => ({
        type: "FeatureCollection",
        features: rows.map((row: any) => ({
          type: "Feature",
          properties: Object.fromEntries(properties.map((prop) => [prop, row[prop]])),
          geometry: JSON.parse(row.geojson),
        })),
      })
  
      // Criando GeoJSON para cada conjunto de dados
      const geoJson = {
        estradas: convertToGeoJSON(estradas, ["id", "nome", "tipo", "codigo"]),
        bacia: convertToGeoJSON(bacia_rio_da_prata, ["id"]),
        leito: convertToGeoJSON(leito_rio_da_prata, ["id"]),
        banhado: convertToGeoJSON(banhado_rio_da_prata, ["id"]),
        desmatamento: convertToGeoJSON(desmatamento, ["id", "alertid", "alertcode", "alertha", "source", "detectat", "detectyear", "state", "stateha"]),
        propriedades: convertToGeoJSON(propriedades, ["id", "cod_tema", "nom_tema", "cod_imovel", "mod_fiscal", "num_area", "ind_status", "ind_tipo", "des_condic", "municipio"]),
        firms: convertToGeoJSON(firms, [ "acq_date", "acq_time"]),
      }

      return geoJson;

 }