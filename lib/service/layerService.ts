import { LayerResponseDTO, LayerSchemaConfig, LayerVisualConfig, MapFeatureCollection } from "@/types/map-dto";
import { getLayerCatalog, getGenericLayerData } from "../repositories/layerRepository";
import { layerCatalogInMonitoramento } from "@/db/schema";
import { db } from "@/db";
import { desc, sql } from "drizzle-orm";
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
    "desmatamento": async (start?: Date, end?: Date) => {
        const data = await findAllDesmatamentoDataWithGeometry(start, end);
        return toFeatureCollection(data.rows || data);
    },
    "raw_firms": async (start?: Date, end?: Date) => {
        const data = await findAllFirmsDataWithGeometry(start, end);
        return toFeatureCollection(data.rows || data);
    },
    "propriedades": async () => {
        const data = await findAllPropriedadesDataWithGeometry();
        return toFeatureCollection(data.rows || data);
    },
    // Adicione outras camadas que precisam de tratamento especial
};

// --- HELPER: BUSCAR GRUPOS DISTINTOS ---
async function getLayerGroups(slug: string, column: string, schema: string = 'monitoramento'): Promise<{ id: string, label: string, icon?: string }[]> {
    try {
        if (slug === 'acoes') {
            // Caso especial para tabela acoes (Type A)
            // Assumes column is 'categoria' or 'status' or 'tipo'
            // We need to match the column name to the schema column
            const result = await db.execute(sql`
                SELECT DISTINCT ${sql.identifier(column)} as value
                FROM "monitoramento"."acoes"
                WHERE ${sql.identifier(column)} IS NOT NULL
                ORDER BY 1
            `);
            const rows = result.rows || result;
            // @ts-ignore
            return rows.map((r: any) => {
                const label = r.value;
                let icon = 'activity'; // Default
                const v = String(label).toLowerCase();

                // Heuristic for Icons (moved from frontend)
                if (v.includes('fiscaliz')) icon = 'shield';
                else if (v.includes('recupera')) icon = 'sprout';
                else if (v.includes('monitora')) icon = 'eye';
                else if (v.includes('infra')) icon = 'hammer';
                else if (v.includes('incend') || v.includes('fogo')) icon = 'flame';
                else if (v.includes('agua') || v.includes('rio')) icon = 'waves';

                return {
                    id: r.value,
                    label: r.value,
                    icon: icon
                };
            });
        } else {
            // Caso genérico para layer_data (Type B)
            // column is inside properties JSONB
            const result = await db.execute(sql`
                SELECT DISTINCT properties->>${sql.raw(`'${column}'`)} as value
                FROM "monitoramento"."layer_data"
                WHERE layer_id = (SELECT id FROM "monitoramento"."layer_catalog" WHERE slug = ${slug})
                AND properties->>${sql.raw(`'${column}'`)} IS NOT NULL
                ORDER BY 1
            `);
            const rows = result.rows || result;
            // @ts-ignore
            return rows.map((r: any) => ({
                id: r.value,
                label: r.value
            }));
        }
    } catch (e) {
        console.error(`Error fetching groups for ${slug} on column ${column}:`, e);
        return [];
    }
}

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

            const visualConfig = catalogEntry.visualConfig as LayerVisualConfig;
            const isLatest = visualConfig?.mapDisplay === 'latest';

            // LÓGICA DE FILTRAGEM INTELIGENTE
            // 1. Se for 'latest', SEMPRE busca o dado mais recente de todos os tempos (ignora filtro global)
            // 2. Se NÃO for latest, só aplica o filtro de data se a camada estiver configurada para isso (dateFilter: true)
            //    Isso evita que camadas estáticas (como Bacias, Leito) sumam.

            const shouldFilterDate = !isLatest && visualConfig?.dateFilter;

            data = await getGenericLayerData(catalogEntry.id, 'monitoramento', {
                limit: isLatest ? 1 : undefined,
                startDate: shouldFilterDate ? startDate : undefined,
                endDate: shouldFilterDate ? endDate : undefined
            });
        }

        // 3. Montagem do DTO (Mantém igual)
        const visualConfig = catalogEntry.visualConfig as LayerVisualConfig;
        const schemaConfig = catalogEntry.schemaConfig as LayerSchemaConfig;
        const dateFilter = visualConfig?.dateFilter ?? (visualConfig?.mapDisplay === 'date_filter');

        // Resolve Group By Column
        // Force 'actions' to use 'categoria', otherwise respect config
        const groupByColumn = catalogEntry.slug === 'acoes' ? 'categoria' : visualConfig?.groupByColumn;

        let groups: { id: string, label: string }[] | undefined;
        if (groupByColumn) {
            groups = await getLayerGroups(slug, groupByColumn);
        }

        // Create the final layer object
        const finalLayer: LayerResponseDTO = {
            id: catalogEntry.id,
            slug: catalogEntry.slug,
            name: catalogEntry.name,
            ordering: catalogEntry.ordering || catalogEntry.id,
            visualConfig: {
                ...visualConfig,
                dateFilter: dateFilter,
                groupByColumn: groupByColumn
            },
            schemaConfig: schemaConfig,
            data: data,
            groups: groups
        };

        // --- BACKEND VISUAL INJECTION (LEGACY SUPPORT) ---
        // Ensure visualConfig exists
        if (!finalLayer.visualConfig) {
            finalLayer.visualConfig = { category: 'Monitoramento' }; // Default minimal config
        }

        // Ensure legacy layers have their icons defined here effectively acting as "DB Defaults"
        if (!finalLayer.visualConfig.mapMarker) {
            finalLayer.visualConfig.mapMarker = { type: 'point' };
        }

        // Firms
        if (slug === 'raw_firms' || slug === 'firms') {
            if (!finalLayer.visualConfig.mapMarker.icon) finalLayer.visualConfig.mapMarker.icon = 'flame';
            if (!finalLayer.visualConfig.mapMarker.color) finalLayer.visualConfig.mapMarker.color = '#ef4444';
        }
        // Deque / Ponte
        if (slug === 'deque-de-pedras' || slug === 'ponte-do-cure') {
            if (!finalLayer.visualConfig.mapMarker.icon) finalLayer.visualConfig.mapMarker.icon = 'waves';
            if (!finalLayer.visualConfig.mapMarker.color) finalLayer.visualConfig.mapMarker.color = '#0ea5e9';
        }
        // Acoes
        if (slug === 'acoes') {
            if (!finalLayer.visualConfig.mapMarker.icon) finalLayer.visualConfig.mapMarker.icon = 'activity';
            if (!finalLayer.visualConfig.mapMarker.color) finalLayer.visualConfig.mapMarker.color = '#22c55e';
        }

        return finalLayer;

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