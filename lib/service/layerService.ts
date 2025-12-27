import { LayerResponseDTO, LayerSchemaConfig, LayerVisualConfig, MapFeatureCollection } from "@/types/map-dto";
import { getLayerCatalog, getGenericLayerData } from "../repositories/layerRepository";
import { layerCatalogInMonitoramento } from "@/db/schema";
import { db } from "@/db";
import { desc } from "drizzle-orm";
import { findAllAcoesDataWithGeometry } from "../repositories/acoesRepository";
import { toFeatureCollection } from "../helpers/geo-utils";
import { findAllEstradasDataWithGeometry } from "../repositories/estradasRepository";
import { findAllDesmatamentoDataWithGeometry } from "../repositories/desmatamentoReposiroty";
import { findAllFirmsDataWithGeometry } from "../repositories/firmsRepository";
import { findAllPropriedadesDataWithGeometry } from "../repositories/propriedadesRepository";


// --- 1. CONFIGURAÇÃO DAS ESTRATÉGIAS ---
// --- 1. CONFIGURAÇÃO DAS ESTRATÉGIAS ---
const STATIC_STRATEGIES: Record<string, (start?: Date, end?: Date) => Promise<MapFeatureCollection>> = {
    "acoes": async (start?: Date, end?: Date) => {
        const data = await findAllAcoesDataWithGeometry(start, end);
        // O helper converte o array de linhas do repo para GeoJSON
        return toFeatureCollection(data.rows || data);
    },
    "estradas": async () => {
        const data = await findAllEstradasDataWithGeometry();
        return toFeatureCollection(data.rows || data);
    },
    "desmatamento": async () => {
        const data = await findAllDesmatamentoDataWithGeometry();
        return toFeatureCollection(data.rows || data);
    },
    "raw_firms": async () => {
        const data = await findAllFirmsDataWithGeometry();
        return toFeatureCollection(data.rows || data);
    },
    "propriedades": async () => {
        const data = await findAllPropriedadesDataWithGeometry();
        return toFeatureCollection(data.rows || data);
    },
    // Adicione outras camadas que precisam de tratamento especial
};

/**
 * THE MAESTRO: Combines Catalog Configuration + Database GeoJSON
 * Orchestrates the assembly of the final LayerResponseDTO.
 */
export async function getLayer(slug: string, startDate?: Date, endDate?: Date): Promise<LayerResponseDTO | null> {
    try {
        // 1. Busca Metadados no Catálogo
        const catalogEntry = await getLayerCatalog(slug);

        if (!catalogEntry) {
            console.warn(`Layer não encontrada no catálogo: ${slug}`);
            return null; // Retorna null e o getAllLayers filtra depois
        }

        let data: MapFeatureCollection;

        // 2. O Roteador de Decisão (The Router)

        // CAMINHO A: É uma camada VIP/Especial? (Hardcoded Strategy)
        if (STATIC_STRATEGIES[slug]) {
            // console.log(`🎻 Maestro: Usando Estratégia Estática para ${slug}`);
            data = await STATIC_STRATEGIES[slug](startDate, endDate);
        }

        // CAMINHO B: É uma camada Padrão do Usuário? (Generic Data)
        else {
            // console.log(`🎻 Maestro: Buscando dados genéricos para ${slug} (ID: ${catalogEntry.id})`);
            // Busca SOMENTE na tabela layer_data, usando o ID numérico
            // TODO: Implementar filtro de data no genericLayerData se necessário
            data = await getGenericLayerData(catalogEntry.id, 'monitoramento');
        }

        // 3. Montagem do DTO (Mantém igual)
        const visualConfig = catalogEntry.visualConfig as LayerVisualConfig;
        const schemaConfig = catalogEntry.schemaConfig as LayerSchemaConfig;
        const dateFilter = visualConfig?.dateFilter ?? (visualConfig?.mapDisplay === 'date_filter');

        return {
            id: catalogEntry.id,
            slug: catalogEntry.slug,
            name: catalogEntry.name,
            ordering: catalogEntry.ordering || catalogEntry.id,
            visualConfig: {
                ...visualConfig,
                dateFilter: dateFilter
            },
            schemaConfig: schemaConfig,
            data: data
        };

    } catch (error) {
        console.error(`Maestro Error assembling layer ${slug}:`, error);
        return null;
    }
}

/**
 * Fetches ALL layers defined in the catalog.
 * Robust against individual layer failures.
 */
export async function getAllLayers(startDate?: Date, endDate?: Date): Promise<LayerResponseDTO[]> {
    const catalogEntries = await db
        .select()
        .from(layerCatalogInMonitoramento)
        .orderBy(desc(layerCatalogInMonitoramento.ordering)); // Ordena pelo campo correto se existir

    if (!catalogEntries.length) return [];

    const layerPromises = catalogEntries.map(entry => getLayer(entry.slug, startDate, endDate));
    const results = await Promise.allSettled(layerPromises);

    const validLayers: LayerResponseDTO[] = [];

    results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
            validLayers.push(result.value);
        } else if (result.status === 'rejected') {
            console.error(`Failed to load layer ${catalogEntries[index].slug}:`, result.reason);
        }
    });

    return validLayers.sort((a, b) => (a.ordering || 0) - (b.ordering || 0));
}