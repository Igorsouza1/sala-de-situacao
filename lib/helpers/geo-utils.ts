import { MapFeature, MapFeatureCollection, Geometry } from "@/types/map-dto";

/**
 * Normalizes a list of database rows into a GeoJSON FeatureCollection.
 * It automatically detects geometry columns and separates them from properties.
 * * @param rows Raw array of objects from the database
 * @returns A standard GeoJSON FeatureCollection typed with T
 */
export function toFeatureCollection<T = any>(rows: any[]): MapFeatureCollection<T> {
    const features: MapFeature<T>[] = rows.reduce((acc: MapFeature<T>[], row) => {
        // 1. Hunt for Geometry Column Name
        let geometryColumnName: string | null = null;
        let geometryPayload: any = null;

        if (row.geojson !== undefined) {
            geometryColumnName = 'geojson';
            geometryPayload = row.geojson;
        } else if (row.st_asgeojson !== undefined) {
            geometryColumnName = 'st_asgeojson';
            geometryPayload = row.st_asgeojson;
        } else if (row.geom !== undefined) {
            geometryColumnName = 'geom';
            geometryPayload = row.geom;
        }

        // If no geometry found, skip this row
        if (!geometryPayload) {
            return acc;
        }

        // 2. Normalize Geometry
        let geometry: Geometry | null = null;
        try {
            if (typeof geometryPayload === 'string') {
                geometry = JSON.parse(geometryPayload);
            } else if (typeof geometryPayload === 'object') {
                geometry = geometryPayload;
            }

            // Validation: Must have 'type' AND ('coordinates' OR 'geometries')
            // [Prisma Dica] Isso cobre GeometryCollection que não tem 'coordinates'
            const isValidGeometry = geometry &&
                geometry.type &&
                (geometry.coordinates || (geometry as any).geometries);

            if (!isValidGeometry) {
                return acc;
            }
        } catch (e) {
            console.warn(`Failed to parse geometry for row ID ${row.id}:`, e);
            return acc;
        }

        // 3. Separate Properties using Destructuring (Cleaner & Faster)
        // Remove a geometria das propriedades
        const { [geometryColumnName!]: _geo, ...rest } = row;

        // Garante que o ID esteja isolado, mas mantém nas properties se desejar
        // (Geralmente removemos o ID das properties se ele já está no nível raiz, 
        // mas sua lógica original de manter é segura)
        const id = row.id ?? undefined;

        const feature: MapFeature<T> = {
            type: "Feature",
            id: id,
            geometry: geometry as Geometry,
            properties: rest as T // O resto vira as propriedades tipadas
        };

        acc.push(feature);
        return acc;
    }, []);

    return {
        type: "FeatureCollection",
        features: features
    };
}