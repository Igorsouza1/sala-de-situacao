import {
  addAcaoImageById,
  findAllAcoesData,
  findAllAcoesDataWithGeometry,
  updateAcaoById,
  insertAcaoData,
  findAcaoById,
  findAllAcoesUpdates,
  deleteAcaoUpdateById,
} from "@/lib/repositories/acoesRepository";
import {
  insertTrilhaData,
  insertWaypointDataInWaypointsTable,
} from "@/lib/repositories/exepedicoesRepository";
import { uploadAzure } from "../azure";

import type { TrilhaInput, WaypointInput } from "@/lib/validations/acoes";

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

export async function deleteAcaoItemHistoryById(id: number){
  const result = await deleteAcaoUpdateById(id);
  return result;
}

// export async function updateAcaoAndUploadImageById(
//   id: number,
//   formData: FormData
// ) {
//   // 1. Separamos os campos de texto dos arquivos
//   const textUpdates: Record<string, any> = {};
//   const files: File[] = [];

//   for (const [key, value] of formData.entries()) {
//     if (value instanceof File) {
//       files.push(value);
//     } else {
//       textUpdates[key] = value;
//     }
//   }

//   //    Só atualizamos o banco se houver campos de texto para atualizar.
//   if (Object.keys(textUpdates).length > 0) {
//     await updateAcaoById(id, textUpdates);
//   }

//   //    Só executamos a lógica de upload se houver arquivos.
//   if (files.length > 0) {
//     for (const file of files) {
//       const path = `${id}/${Date.now()}-${file.name}`;
//       const imageUrl = await uploadAzure(file, path);
//       await addAcaoImageById(id, imageUrl, textUpdates.descricao || "");
//     }
//   }

//   return { message: "Ação atualizada com sucesso!" };
// }


// REMOVER ESSA FUNÇÃO
// export async function createAcoesWithTrilha(input: {
//   trilha: TrilhaInput;
//   waypoints: (WaypointInput & { fotos?: File[] })[];
// }) {
//   const trilhaRecord = await insertTrilhaData({
//     nome: input.trilha.nome,
//     dataInicio: input.trilha.dataInicio ?? null,
//     dataFim: input.trilha.dataFim ?? null,
//     duracaoMinutos: input.trilha.duracaoMinutos ?? null,
//     geom: input.trilha.geom,
//   });

//   const trilhaId = trilhaRecord.id;

//   for (const wp of input.waypoints) {
//     const pointWkt = `POINTZ(${wp.longitude} ${wp.latitude} ${wp.elevation ?? 0})`;

//     await insertWaypointDataInWaypointsTable({
//       trilhaId,
//       nome: wp.name ?? null,
//       ele: wp.elevation ?? null,
//       recordedat: wp.time ?? null,
//       geom: pointWkt,
//     });

//     const acaoRecord = await insertAcaoData({
//       name: wp.name ?? null,
//       latitude: wp.latitude.toString(),
//       longitude: wp.longitude.toString(),
//       elevation: wp.elevation?.toString() ?? '0',
//       time: wp.time ?? null,
//       descricao: wp.descricao ?? null,
//       mes: wp.mes,
//       atuacao: wp.atuacao,
//       acao: wp.acao ?? null,
//       geom: pointWkt,
//     });

//     const acaoId = acaoRecord.id;
//     if (wp.fotos) {
//       for (const file of wp.fotos) {
//         const path = `${acaoId}/${Date.now()}-${file.name}`;
//         const imageUrl = await uploadAzure(file, path);
//         await addAcaoImageById(acaoId, imageUrl, wp.descricao ?? "");
//       }
//     }
//   }

//   return { trilhaId };
// }



export async function getAcaoDossie(id: number) {
  // 1. Busca os dados principais e o histórico em paralelo
  const [acaoPrincipal, historico] = await Promise.all([
    findAcaoById(id),
    findAllAcoesUpdates(id)
  ]);

  // 2. Regra de negócio: se a ação principal não existe, é um erro
  if (!acaoPrincipal) {
    // O handler da API vai transformar isso em um 404
    throw new Error("Ação não encontrada"); 
  }

  // 3. Transforma o histórico para o formato esperado pelo frontend
  const formattedHistory = historico.map((update: any) => ({
    id: String(update.id), // <-- simples, sem prefixo
    tipoUpdate: update.url && update.url.trim() !== "" && update.url !== "text-only-update" ? "midia" : "criacao",
    descricao: update.descricao,
    urlMidia: update.url && update.url !== "text-only-update" ? update.url : null,
    timestamp: update.timestamp || update.createdAt || null,
  }));

  // 4. Combina tudo em um único objeto para o frontend
  return {
    ...acaoPrincipal,
    history: formattedHistory,
  };
}

/**
 * Adiciona um novo update ao histórico de uma ação
 * Pode ser uma mídia (com ou sem descrição) ou apenas uma descrição
 */
export async function addAcaoUpdate(
  acaoId: number,
  input: {
    file?: File
    descricao?: string
    atualizacao?: Date
  }
) {
  // se não vier nada, usa "hoje" como fallback
  const efetivaAtualizacao = input.atualizacao ?? new Date()

  // Se houver arquivo, faz upload e adiciona como mídia
  if (input.file) {
    const path = `${acaoId}/${Date.now()}-${input.file.name}`
    const imageUrl = await uploadAzure(input.file, path)

    await addAcaoImageById(
      acaoId,
      imageUrl,
      input.descricao || "",
      efetivaAtualizacao,       // 👈 AGORA VAI
    )

    return { message: "Mídia adicionada com sucesso!" }
  }

  // Se não houver arquivo mas houver descrição, adiciona apenas a descrição
  if (input.descricao) {
    const placeholderUrl = "text-only-update"

    await addAcaoImageById(
      acaoId,
      placeholderUrl,
      input.descricao,
      efetivaAtualizacao,       // 👈 AQUI TAMBÉM
    )

    return { message: "Descrição adicionada com sucesso!" }
  }

  throw new Error("É necessário fornecer uma mídia ou uma descrição")
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
