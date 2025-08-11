

import { addAcaoImageById, findAllAcoesData, findAllAcoesDataWithGeometry, updateAcaoById } from "@/lib/repositories/acoesRepository";
import { findAllAcoesImagesData } from "@/lib/repositories/acoesRepository";
import { uploadAzure } from "../azure";



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


export async function updateAcaoAndUploadImageById(id: number,  formData: FormData) {
  // 1. Separamos os campos de texto dos arquivos
  const textUpdates: Record<string, any> = {};
  const files: File[] = [];

  for (const [key, value] of formData.entries()) {
    if (value instanceof File) {
      files.push(value);
    } else {
      textUpdates[key] = value;
    }
  }

  //    Só atualizamos o banco se houver campos de texto para atualizar.
  if (Object.keys(textUpdates).length > 0) {
    await updateAcaoById(id, textUpdates);
  }

  //    Só executamos a lógica de upload se houver arquivos.
  if (files.length > 0) {
    for (const file of files) {
      const path = `${id}/${Date.now()}-${file.name}`;
      const imageUrl = await uploadAzure(file, path);
      await addAcaoImageById(id, imageUrl, textUpdates.descricao || "");
    }
  }

  return { message: "Ação atualizada com sucesso!" };
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