
import { findAllExpedicoesData } from "../repositories/exepedicoesRepository";


export async function getAllExpedicoesData(){
    const { trilhas, waypoints } = await findAllExpedicoesData();


    // PRECISA DE REFATORAÇÃ
    const trilhasGeoJSON = {
        type: "FeatureCollection",
        features: trilhas.map((row: any) => ({
          type: "Feature",
          properties: {
            id: row.id,
            expedicao: row.nome,
            data: row.data_inicio,
            data_fim: row.data_fim,
            duracao: row.duracao_minutos,
          },
          geometry: JSON.parse(row.geojson),
        })),
      }
  
      const waypointsGeoJSON = {
        type: "FeatureCollection",
        features: waypoints.map((row: any) => ({
          type: "Feature",
          properties: {
            id: row.id,
            trilhaId: row.trilha_id,
            expedicao: row.trilha_nome,
            name: row.nome,
            ele: row.ele,
            data: row.recordedat,
          },
          geometry: JSON.parse(row.geojson),
        })),
      }

      return {
        trilhas: trilhasGeoJSON,
        waypoints: waypointsGeoJSON,
      }

}