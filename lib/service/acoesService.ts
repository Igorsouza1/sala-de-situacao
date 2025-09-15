import {
  addAcaoImageById,
  findAllAcoesData,
  findAllAcoesDataWithGeometry,
  updateAcaoById,
  findAllAcoesImagesData,
  insertAcaoData,
} from "@/lib/repositories/acoesRepository";
import {
  insertTrilhaData,
  insertWaypointDataInWaypointsTable,
} from "@/lib/repositories/exepedicoesRepository";
import { uploadAzure } from "../azure";

import type { TrilhaInput, WaypointInput } from "@/lib/validations/acoes";

// Retorna todas as ações
// UTILIZAREMOS PARA O DASHBOARD
export async function getAllAcoesData(regiaoId: number) {
  const acoesData = await findAllAcoesData(regiaoId);
  return acoesData;
}

// Retorna todas as ações com geometria
export async function getAllAcoesForMap(regiaoId: number) {
  const acoesDataWithGeometry = await findAllAcoesDataWithGeometry(regiaoId);
  const actionsGeoJSON = formatAcoesToGeojson(acoesDataWithGeometry);
  return actionsGeoJSON;
}

export async function getAllAcoesImagesData(id: number) {
  const acoesImagesData = await findAllAcoesImagesData(id);
  return acoesImagesData;
}

export async function updateAcaoAndUploadImageById(
  id: number,
  formData: FormData
) {
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

export async function createAcoesWithTrilha(input: {
  regiaoId: number;
  trilha: TrilhaInput;
  waypoints: (WaypointInput & { fotos?: File[] })[];
}) {
  const trilhaRecord = await insertTrilhaData({
    nome: input.trilha.nome,
    regiaoId: input.regiaoId,
    dataInicio: input.trilha.dataInicio ?? null,
    dataFim: input.trilha.dataFim ?? null,
    duracaoMinutos: input.trilha.duracaoMinutos ?? null,
    geom: input.trilha.geom,
  });

  const trilhaId = trilhaRecord.id;

  for (const wp of input.waypoints) {
    const pointWkt = `POINTZ(${wp.longitude} ${wp.latitude} ${wp.elevation ?? 0})`;

    await insertWaypointDataInWaypointsTable({
      trilhaId,
      nome: wp.name ?? null,
      ele: wp.elevation ?? null,
      recordedat: wp.time ?? null,
      geom: pointWkt,
    });

    const acaoRecord = await insertAcaoData({
      regiaoId: input.regiaoId,
      name: wp.name ?? null,
      latitude: wp.latitude.toString(),
      longitude: wp.longitude.toString(),
      elevation: wp.elevation?.toString() ?? '0',
      time: wp.time ?? null,
      descricao: wp.descricao ?? null,
      mes: wp.mes,
      atuacao: wp.atuacao,
      acao: wp.acao ?? null,
      geom: pointWkt,
    });

    const acaoId = acaoRecord.id;
    if (wp.fotos) {
      for (const file of wp.fotos) {
        const path = `${acaoId}/${Date.now()}-${file.name}`;
        const imageUrl = await uploadAzure(file, path);
        await addAcaoImageById(acaoId, imageUrl, wp.descricao ?? "");
      }
    }
  }

  return { trilhaId };
}

// -----------------------------------------

// TODO: COLOCAR EM UMA FUNCAO HELPER
//
function formatAcoesToGeojson(acoes: any[]) {
  const groupedActions = acoes.reduce(
    (acc: { [key: string]: any[] }, action: any) => {
      const acao = action.acao;
      if (!acc[acao]) {
        acc[acao] = [];
      }
      acc[acao].push({
        type: "Feature",
        properties: {
          id: action.id,
          acao: action.acao,
          name: action.name,
          descricao: action.descricao,
          mes: action.mes,
          time: action.time,
        },
        geometry: action.geojson ? JSON.parse(action.geojson) : null,
      });
      return acc;
    },
    {}
  );

  // Converter ações agrupadas em GeoJSON FeatureCollections
  const actionsGeoJSON = Object.entries(groupedActions).reduce(
    (acc: { [key: string]: any }, [acao, features]) => {
      acc[acao] = {
        type: "FeatureCollection",
        features: features,
      };
      return acc;
    },
    {}
  );

  return actionsGeoJSON;
}
