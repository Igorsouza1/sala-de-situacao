
import { gpx as gpxToGeoJSONConverter } from "@tmcw/togeojson";
import { DOMParser } from "@xmldom/xmldom";
import type { FeatureCollection, LineString, Position, Geometry, Point  } from "geojson";

/**
 * Converte um arquivo GPX para um objeto GeoJSON.
 * @param file O arquivo vindo do formulário.
 * @returns Uma Promise que resolve com o objeto FeatureCollection.
 * @throws Lança um erro se o arquivo for inválido ou o GPX estiver mal formatado.
 */
export async function convertGpxToGeoJSON(file: unknown): Promise<FeatureCollection> {
  if (!(file instanceof File)) {
    throw new Error("Arquivo não enviado ou inválido.");
  }

  const gpxString = await file.text();
  const xmlDoc = new DOMParser().parseFromString(gpxString, "text/xml");
  const geojson = gpxToGeoJSONConverter(xmlDoc) as FeatureCollection;

  if (!geojson || !geojson.features) {
    throw new Error("Não foi possível extrair features do arquivo GPX.");
  }

  return geojson;
}


//Type Guard para checar se uma geometria é LineString
const isLineString = (g: Geometry): g is LineString => g.type === "LineString";

/**
 * Extrai a trilha de um GeoJSON e a converte para o formato WKT MULTILINESTRING Z.
 * @param geojson O objeto FeatureCollection processado.
 * @returns Uma string contendo a trilha em formato WKT.
 * @throws Lança um erro se nenhuma trilha (LineString) for encontrada.
 */
export function extractTrackAsWKT(geojson: FeatureCollection): string {
  const segments: string[] = [];

  for (const feature of geojson.features) {
    if (isLineString(feature.geometry)) {
      // Mapeia cada ponto [longitude, latitude, elevação] para uma string "lon lat ele"
      const coords = feature.geometry.coordinates
        .map((pos: Position) => `${pos[0]} ${pos[1]} ${pos[2] ?? 0}`)
        .join(",");
      
      segments.push(`(${coords})`);
    }
  }

  if (segments.length === 0) {
    throw new Error("Nenhuma trilha (LineString) encontrada no GeoJSON.");
  }

  // Monta a string final no formato que o PostGIS entende
  return `MULTILINESTRING Z (${segments.join(",")})`;
}




// Uma "Type Guard" para checar se uma geometria é um Ponto
const isPoint = (g: Geometry): g is Point => g.type === "Point";


/**
 * Extrai os waypoints (pontos de referência) de um GeoJSON.
 * @param geojson O objeto FeatureCollection processado.
 * @returns Um array de objetos, cada um representando um waypoint.
 */
export function extractWaipointsAsWKT(geojson: FeatureCollection){
  const pointFeatures = geojson.features.filter(feature => 
    isPoint(feature.geometry)
  );

  const waypoints = pointFeatures.map(feature => {
    const geom = feature.geometry as Point; 
    const [lon, lat, ele] = geom.coordinates;

    return {
      nome: feature.properties?.name ?? null,
      horario: feature.properties?.time ?? null,
      lon: lon,
      lat: lat,
      ele: ele ?? 0,
    };
  });

  return waypoints;
}