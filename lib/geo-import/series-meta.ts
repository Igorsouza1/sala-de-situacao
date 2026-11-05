// O que a tela manda ao servidor junto da série de anos (e o que fica no catálogo). Fica fora da rota para a tela e o servidor
// falarem a mesma língua, e para o teste conferir as regras sem subir o servidor.

import { z } from "zod";

/** o formato da série gravada (ver class-series.ts e a migration 0015) */
export const SERIES_FORMAT = "classes-delta-v1";
/** o corpo de uma requisição na Vercel passa de pouco mais de 4 MB; a tabela tem o mesmo teto */
export const MAX_SERIES_STORED_BYTES = 4_000_000;
/** a amostra da camada na lista de Camadas: o verde da formação florestal do MapBiomas (o mapa usa a cor de cada classe) */
export const SERIES_SWATCH = "#1f8d49";
/** a amostra de uma série de fogo por mês: a cor de fogo do projeto (DESIGN.md 4.2, crítico e fogo) */
export const FIRE_SWATCH = "#c8431a";
export const MAX_SERIES_YEARS = 80;
const MAX_CLASSES = 64;

export const seriesMetaSchema = z
  .object({
    name: z.string().trim().min(1, "Dê um nome à camada.").max(80, "O nome está comprido demais."),
    regiaoId: z.number().int().positive(),
    width: z.number().int().positive().max(20000),
    height: z.number().int().positive().max(20000),
    bounds: z.tuple([z.number().min(-180), z.number().min(-90), z.number().max(180), z.number().max(90)]),
    years: z.array(z.number().int().min(1900).max(2100)).min(1, "Faltou o ano do raster.").max(MAX_SERIES_YEARS),
    stats: z.object({
      classes: z.array(z.number().int().min(1).max(254)).max(MAX_CLASSES),
      ha: z.array(z.array(z.number().min(0))),
    }),
    mapbiomas: z.boolean(),
    /** como ler as classes: uso do solo do MapBiomas, mês do fogo ou classes sem legenda (ausente: pelo `mapbiomas`) */
    legend: z.enum(["mapbiomas", "meses", "classes"]).optional(),
  })
  .superRefine((m, ctx) => {
    if (m.bounds[0] >= m.bounds[2] || m.bounds[1] >= m.bounds[3]) ctx.addIssue({ code: "custom", message: "Os limites do raster não fecham uma área." });
    if (m.years.some((y, i) => i > 0 && y <= m.years[i - 1])) ctx.addIssue({ code: "custom", message: "Os anos da série precisam vir em ordem, sem repetir." });
    if (m.stats.ha.length !== m.years.length || m.stats.ha.some((row) => row.length !== m.stats.classes.length))
      ctx.addIssue({ code: "custom", message: "As áreas por classe não conferem com os anos da série." });
  });

export type SeriesMeta = z.infer<typeof seriesMetaSchema>;
