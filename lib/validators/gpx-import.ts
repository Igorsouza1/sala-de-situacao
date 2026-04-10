import { z } from "zod";

/**
 * Schema Zod para validação do request de importação GPX
 * Valida trilha (opcional), região e ações (waypoints)
 */

// Enums do banco de dados
const categoriaAcaoSchema = z.enum([
  "Fiscalização",
  "Recuperação",
  "Incidente",
  "Monitoramento",
  "Infraestrutura",
]);

const statusAcoesSchema = z.enum([
  "Identificado",
  "Em Recuperação",
  "Concluído",
]);

// Schema para fotos de ação (descrição apenas, files vêm separadamente)
const fotoAcaoSchema = z.object({
  descricao: z.string().max(255).optional(),
});

// Schema para cada ação (waypoint)
const acaoSchema = z.object({
  nome: z.string().min(3).max(255),
  acao: z.string().min(3).max(100),
  descricao: z.string().min(3).max(255),
  categoria: categoriaAcaoSchema,
  tipo: z.string().min(3).max(100),
  status: statusAcoesSchema,
  eixoTematico: z.string().max(100),
  tipoTecnico: z.string().max(100),
  carater: z.string().max(50),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  elevation: z.number().optional(),
  time: z.string().optional(),
  fotosDesc: z.array(fotoAcaoSchema).max(2).optional(),
});

// Schema para trilha (opcional)
const trilhaSchema = z.object({
  nome: z.string().min(3).max(255),
  geom: z.string(), // WKT MULTILINESTRING Z
  dataInicio: z.string().optional(), // Aceita qualquer string datetime
  dataFim: z.string().optional(),
});

// Schema principal do request
export const gpxImportRequestSchema = z.object({
  regiaoId: z.number().int().positive(),
  trilha: trilhaSchema.optional(),
  acoes: z.array(acaoSchema).min(1),
});

// Tipos exportados
export type GpxImportRequest = z.infer<typeof gpxImportRequestSchema>;
export type AcaoRequest = z.infer<typeof acaoSchema>;
export type TrilhaRequest = z.infer<typeof trilhaSchema>;
