import { NextResponse } from "next/server"
import { db } from "@/db"

export async function GET() {
  try {
    // Executa queries para buscar dados de múltiplas tabelas no schema "rio_da_prata"
    const [Estradas, bacia_rio_da_prata, leito_rio_da_prata, desmatamento, propriedades, firms, banhado_rio_da_prata] = await Promise.all([
      db.execute(`
        SELECT id, nome, tipo, codigo, ST_AsGeoJSON(geom) as geojson
        FROM "rio_da_prata"."estradas"
      `),
      db.execute(`
        SELECT id, ST_AsGeoJSON(geom) as geojson
        FROM "rio_da_prata"."Bacia_Rio_Da_Prata"
      `),
      db.execute(`
        SELECT id, ST_AsGeoJSON(geom) as geojson
        FROM "rio_da_prata"."Leito_Rio_Da_Prata"
      `),
      db.execute(`
        SELECT id, alertid, alertcode, alertha, source, detectat, detectyear, state, stateha, ST_AsGeoJSON(geom) as geojson
        FROM "rio_da_prata"."desmatamento"
      `),
      db.execute(`
        SELECT id, cod_tema, nom_tema, cod_imovel, mod_fiscal, num_area, ind_status, ind_tipo, des_condic, municipio, ST_AsGeoJSON(geom) as geojson
        FROM "rio_da_prata"."propriedades"
      `),
      db.execute(`
        SELECT  acq_date, acq_time, ST_AsGeoJSON(geom) as geojson
        FROM "rio_da_prata"."raw_firms"
      `),
      
      db.execute(`
        SELECT id, ST_AsGeoJSON(geom) as geojson
        FROM "rio_da_prata"."Banhado_Rio_Da_Prata"
      `),
      
    ])

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
      estradas: convertToGeoJSON(Estradas.rows, ["id", "nome", "tipo", "codigo"]),
      bacia: convertToGeoJSON(bacia_rio_da_prata.rows, ["id"]),
      leito: convertToGeoJSON(leito_rio_da_prata.rows, ["id"]),
      banhado: convertToGeoJSON(banhado_rio_da_prata.rows, ["id"]),
      desmatamento: convertToGeoJSON(desmatamento.rows, ["id", "alertid", "alertcode", "alertha", "source", "detectat", "detectyear", "state", "stateha"]),
      propriedades: convertToGeoJSON(propriedades.rows, ["id", "cod_tema", "nom_tema", "cod_imovel", "mod_fiscal", "num_area", "ind_status", "ind_tipo", "des_condic", "municipio"]),
      firms: convertToGeoJSON(firms.rows, [ "acq_date", "acq_time"]),
    }

    return NextResponse.json(geoJson)
  } catch (error) {
    console.error('Erro em /api/map:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

