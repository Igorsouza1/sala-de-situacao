import { db } from "@/db";
import {
  acoesInMonitoramento,
  trilhasInMonitoramento,
  fotosAcoesInMonitoramento,
  regioesInMonitoramento,
} from "@/db/schema";
import { createAdminClient } from "@/lib/supabase/admin";
import { eq, sql } from "drizzle-orm";

export interface FotoUpload {
  file: File;
  descricao?: string;
}

export interface AcaoData {
  nome: string;
  acao: string;
  descricao?: string;
  categoria: "Fiscalização" | "Recuperação" | "Incidente" | "Monitoramento" | "Infraestrutura";
  tipo: string;
  status: "Identificado" | "Em Recuperação" | "Concluído";
  eixoTematico: string;
  tipoTecnico: string;
  carater: string;
  latitude: number;
  longitude: number;
  elevation?: number;
  time?: string;
  fotos?: FotoUpload[];
}

export interface TrilhaData {
  nome: string;
  geom: string; // WKT MULTILINESTRING Z
  dataInicio?: string;
  dataFim?: string;
}

export interface GpxImportData {
  regiaoId: number;
  trilha?: TrilhaData;
  acoes: AcaoData[];
}

export interface GpxImportResult {
  trilhaId?: number;
  acoesIds: number[];
  totalFotos: number;
}

/**
 * Serviço de importação de GPX
 * Cria trilha (opcional), ações e fotos em transação única
 */
export async function importGpx(data: GpxImportData): Promise<GpxImportResult> {
  const { regiaoId, trilha, acoes } = data;
  const result: GpxImportResult = {
    acoesIds: [],
    totalFotos: 0,
  };

  const supabaseAdmin = createAdminClient();

  try {
    // Validar que região existe
    const regiao = await db
      .select({ id: regioesInMonitoramento.id })
      .from(regioesInMonitoramento)
      .where(eq(regioesInMonitoramento.id, regiaoId))
      .limit(1);

    if (regiao.length === 0) {
      throw new Error(`Região com ID ${regiaoId} não encontrada`);
    }

    // Iniciar transação
    await db.transaction(async (tx) => {
      // 1. Criar trilha se presente
      if (trilha) {
        console.log("[DEBUG] Inserindo trilha:", {
          nome: trilha.nome,
          geomLength: trilha.geom.length,
          geomStart: trilha.geom.substring(0, 100),
        });

        const trilhaResult = await tx
          .insert(trilhasInMonitoramento)
          .values({
            nome: trilha.nome,
            geom: sql`ST_SnapToGrid(ST_GeomFromText(${trilha.geom}, 4674), 0.00001)` as any,
            dataInicio: trilha.dataInicio,
            dataFim: trilha.dataFim,
            regiaoId,
          })
          .returning({ id: trilhasInMonitoramento.id });

        result.trilhaId = trilhaResult[0].id;
        console.log("[DEBUG] Trilha criada com ID:", result.trilhaId);
      }

      // 2. Criar ações e fotos
      for (const acao of acoes) {
        // Criar WKT para geometria POINT Z
        const elevation = acao.elevation || 0;
        const geomWkt = `POINT Z (${acao.longitude} ${acao.latitude} ${elevation})`;

        const acaoResult = await tx
          .insert(acoesInMonitoramento)
          .values({
            name: acao.nome,
            acao: acao.acao,
            descricao: acao.descricao || null,
            categoria: acao.categoria,
            tipo: acao.tipo,
            status: acao.status,
            eixoTematico: acao.eixoTematico,
            tipoTecnico: acao.tipoTecnico,
            carater: acao.carater,
            latitude: sql`${acao.latitude}::numeric(10,6)`,
            longitude: sql`${acao.longitude}::numeric(10,6)`,
            elevation: acao.elevation ? sql`${acao.elevation}::numeric(8,2)` : null,
            time: acao.time || null,
            geom: sql`ST_GeomFromText(${geomWkt}, 4674)` as any,
            regiaoId,
          })
          .returning({ id: acoesInMonitoramento.id });

        const acaoId = acaoResult[0].id;
        result.acoesIds.push(acaoId);

        // 3. Upload de fotos se presentes
        if (acao.fotos && acao.fotos.length > 0) {
          for (const foto of acao.fotos) {
            // Upload para Supabase Storage
            const timestamp = Date.now();
            const fileName = foto.file.name.replace(/\s+/g, "_");
            const path = `${acaoId}/${timestamp}_${fileName}`;

            const arrayBuffer = await foto.file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            const { error: uploadError } = await supabaseAdmin.storage
              .from("acoes")
              .upload(path, buffer, {
                contentType: foto.file.type,
                upsert: false,
              });

            if (uploadError) {
              throw new Error(
                `Falha no upload da foto: ${uploadError.message}`
              );
            }

            // Obter URL público
            const {
              data: { publicUrl },
            } = supabaseAdmin.storage.from("acoes").getPublicUrl(path);

            // Salvar registro da foto
            await tx.insert(fotosAcoesInMonitoramento).values({
              acaoId,
              url: publicUrl,
              descricao: foto.descricao || null,
            });

            result.totalFotos++;
          }
        }
      }
    });

    // Log de sucesso
    console.log("[INFO] GPX importado com sucesso:", {
      regiaoId,
      totalWaypoints: acoes.length,
      totalFotos: result.totalFotos,
      trilhaCriada: !!result.trilhaId,
      trilhaId: result.trilhaId,
      acoesIds: result.acoesIds,
    });

    return result;
  } catch (error) {
    // Log de erro
    console.error("[ERROR] Falha na importação GPX:", {
      error: error instanceof Error ? error.message : "Erro desconhecido",
      regiaoId,
      totalWaypoints: acoes.length,
      acoesCriadasAntesErro: result.acoesIds.length,
    });

    throw error; // Re-lança para o route handler tratar
  }
}
