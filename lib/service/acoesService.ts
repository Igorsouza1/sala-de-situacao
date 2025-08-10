

import { findAllAcoesData, findAllAcoesDataWithGeometry } from "@/lib/repositories/acoesRepository";
import { findAllAcoesImagesData } from "@/lib/repositories/acoesRepository";



// Retorna todas as ações
// UTILIZAREMOS PARA O DASHBOARD
export async function getAllAcoesData() {
  const acoesData = await findAllAcoesData();
  return acoesData;
}


// Retorna todas as ações com geometria
export async function getAllAcoesForMap() {
  const acoesDataWithGeometry = await findAllAcoesDataWithGeometry();
  const actionsGeoJSON = formatAcoesToGeojson(acoesDataWithGeometry);
  return actionsGeoJSON;
}


export async function getAllAcoesImagesData(id: number) {
  const acoesImagesData = await findAllAcoesImagesData(id);
  return acoesImagesData;
}





// -----------------------------------------




   // TODO: COLOCAR EM UMA FUNCAO HELPER
  //  
function formatAcoesToGeojson(acoes: any[]){
   const groupedActions = acoes.reduce((acc: { [key: string]: any[] }, action: any) => {
    const acao = action.acao
    if (!acc[acao]) {
      acc[acao] = []
    }
    acc[acao].push({
      type: "Feature",
      properties: { 
        id: action.id, 
        acao: action.acao, 
        name: action.name, 
        descricao: action.descricao, 
        mes: action.mes ,
        time: action.time
      },
      geometry: action.geojson ? JSON.parse(action.geojson) : null
    })
    return acc
  }, {})


  // Converter ações agrupadas em GeoJSON FeatureCollections
  const actionsGeoJSON = Object.entries(groupedActions).reduce((acc: { [key: string]: any }, [acao, features]) => {
    acc[acao] = {
      type: "FeatureCollection",
      features: features
    }
    return acc
  }, {})


  return actionsGeoJSON
}