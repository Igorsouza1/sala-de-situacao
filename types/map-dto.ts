import { ActionCategory, ActionStatus } from "@/components/map/config/actions-config";

/**
 * Standard GeoJSON Geometry types
 */
export type GeometryType =
    | "Point"
    | "MultiPoint"
    | "LineString"
    | "MultiLineString"
    | "Polygon"
    | "MultiPolygon"
    | "GeometryCollection";

export type Position = number[]; // [longitude, latitude, elevation?]

export interface Geometry {
    type: GeometryType;
    coordinates: Position | Position[] | Position[][] | Position[][][];
}

export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

/**
 * Visual Configuration Interface
 * Maps to layer_catalog.visual_config (JSONB)
 */
export interface LayerChartConfig {
    type: "area" | "line" | "bar";
    unit?: string;
    color?: string;
    title?: string;
    dataKey: string;
}

export interface MapMarkerConfig {
    type: "polygon" | "point" | "circle";
    color?: string;
    fillColor?: string;
    fillOpacity?: number;
    weight?: number;
    icon?: string;
    opacity?: number;
    radius?: number; // Required for type: 'circle'
}

export interface VisualStyle {
    type?: "polygon" | "point" | "circle" | "icon" | "line" | "heatmap";
    color?: string;
    fillColor?: string;
    weight?: number;
    opacity?: number;
    fillOpacity?: number;
    radius?: number;
    dashArray?: string;
    iconName?: string;
}

export interface LayerVisualConfig extends VisualStyle { // Allow direct properties for backward compatibility
    charts?: LayerChartConfig[];
    category: 'Monitoramento' | 'Operacional' | 'Infraestrutura' | 'Base Territorial';
    mapDisplay?: "latest" | "all" | "date_filter";
    dateFilter?: boolean;
    mapMarker?: MapMarkerConfig; // Deprecated but kept for compatibility
    groupByColumn?: string;

    // New Structure
    baseStyle?: VisualStyle;
    rules?: {
        field: string;
        values: {
            [key: string]: VisualStyle;
        };
    };
}

/**
 * Schema Configuration Interface
 * Maps to layer_catalog.schema_config (JSONB)
 */
export interface LayerFieldConfig {
    key: string;
    type: "number" | "text" | "date" | "boolean";
    label: string;
}

export interface LayerSchemaConfig {
    fields: LayerFieldConfig[];
}

/**
 * Base properties shared by all map layers
 */
export interface BaseLayerProperties {
    id?: number | string;
    name?: string;
    description?: string;
    [key: string]: JsonValue | undefined;
}

/**
 * Generic Map Feature (GeoJSON Feature)
 */
export interface MapFeature<P = BaseLayerProperties> {
    type: "Feature";
    geometry: Geometry;
    properties: P;
    id?: number | string;
}

/**
 * Generic Map Feature Collection (GeoJSON FeatureCollection)
 */
export interface MapFeatureCollection<P = BaseLayerProperties> {
    type: "FeatureCollection";
    features: MapFeature<P>[];
}

// --- Specific Property Interfaces for Known Table Mapping ---

// Table: propriedades
export interface PropriedadeProperties extends BaseLayerProperties {
    cod_imovel: string;
    municipio: string;
    mod_fiscal: number;
    num_area: number;
    ind_status: string;
}

// Table: estradas
export interface EstradaProperties extends BaseLayerProperties {
    tipo: string;
    codigo: string;
}

// Table: acoes
export interface ActionProperties extends BaseLayerProperties {
    categoria: ActionCategory;
    status: ActionStatus;
    tipo: string;
    descricao?: string;
    data_registro?: string;
    imagens?: string[]; // URLs
}

// Table: firms (focos de incêndio)
export interface FirmsProperties extends BaseLayerProperties {
    acq_date: string; // ISO Date string
    confidence: string;
    satellite: string;
    frp: number; // Fire Radiative Power
}

// Table: desmatamento
export interface DesmatamentoProperties extends BaseLayerProperties {
    alert_date: string;
    area_ha: number;
    source: string;
}

// --- Unified Layer Response DTO ---

/**
 * Represents a full Layer definition sent to the frontend.
 * Combines the metadata (Catalog) with the data (GeoJSON).
 */
export interface LayerResponseDTO<P = BaseLayerProperties> {
    // Metadata from layer_catalog
    id: number;
    slug: string;
    name: string;
    ordering: number; // Controls z-index/render order

    // Configs
    visualConfig?: LayerVisualConfig;
    schemaConfig?: LayerSchemaConfig;

    // Data (GeoJSON) - Can be populated from distinct tables (acoes, properties) OR layer_data
    data: MapFeatureCollection<P>;

    // Dynamically fetched groups for filtering/display
    groups?: {
        id: string;
        label: string;
        color?: string; // Optional override color for the group
        icon?: string; // Icon name (Lucide) for the group
        count?: number;
    }[];
}

/**
 * API Response for /api/mapLayers
 */
export interface MapLayersResponse {
    layers: LayerResponseDTO[];
}
