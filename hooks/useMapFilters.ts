// hooks/useMapFilters.ts

import { useMemo } from "react";
import { isDatePropWithinRange } from "@/lib/helpers/map-filters";
import { useMapContext } from "@/context/GeoDataContext";
import { ACTION_CATEGORIES, ActionCategory, GroupedActionCategory, GroupedActionType } from "@/components/map/config/actions-config";

// --- Tipagens do Hook ---
interface MapFiltersInput {
    mapData: ReturnType<typeof useMapContext>['mapData'];
    acoesData: ReturnType<typeof useMapContext>['acoesData'];
    expedicoesData: ReturnType<typeof useMapContext>['expedicoesData'];
    dateFilter: ReturnType<typeof useMapContext>['dateFilter'];
}

export function useMapFilters({ mapData, acoesData, expedicoesData, dateFilter }: MapFiltersInput) {

    // 1. FILTERED DESMATAMENTO DATA
    const filteredDesmatamentoData = useMemo(() => {
        if (mapData && mapData.desmatamento) {
            return {
                type: "FeatureCollection",
                features: mapData.desmatamento.features.filter((feature: any) =>
                    isDatePropWithinRange(feature.properties.detectat, dateFilter.startDate, dateFilter.endDate),
                ),
            } as any
        }
        return null
    }, [mapData, dateFilter.startDate, dateFilter.endDate])

    // 2. FILTERED FIRMS DATA
    const filteredFirms = useMemo(() => {
        if (!mapData) return []
        return mapData.firms.features.filter((firm: any) =>
            isDatePropWithinRange(firm.properties.acq_date, dateFilter.startDate, dateFilter.endDate),
        )
    }, [mapData, dateFilter.startDate, dateFilter.endDate])

    // 3. FILTERED AÇÕES (Flattened & Grouped)
    const { filteredAcoesFeatures, groupedActions } = useMemo(() => {
        const features: any[] = [];
        const groups: Record<string, {
            count: number,
            types: Record<string, number>
        }> = {};

        if (acoesData) {
            // Flatten all features first
            Object.values(acoesData).forEach((featureCollection: any) => {
                featureCollection.features.forEach((feature: any) => {
                    if (feature.properties) {
                        const props = feature.properties;

                        // Verifica se a data de criação da ação está no range
                        const isActionInRange = props.time &&
                            isDatePropWithinRange(props.time, dateFilter.startDate, dateFilter.endDate);

                        // Verifica se a data da última foto está no range (se existir)
                        // Atenção: o banco pode retornar null se não tiver fotos
                        const isPhotoInRange = props.ultima_foto_em &&
                            isDatePropWithinRange(props.ultima_foto_em, dateFilter.startDate, dateFilter.endDate);

                        if (isActionInRange || isPhotoInRange) {
                            features.push(feature);

                            // Grouping Logic
                            const cat = (feature.properties.categoria as ActionCategory) || 'Monitoramento'; // Fallback
                            const type = feature.properties.tipo || 'Outros';

                            if (!groups[cat]) {
                                groups[cat] = { count: 0, types: {} };
                            }
                            groups[cat].count++;
                            groups[cat].types[type] = (groups[cat].types[type] || 0) + 1;
                        }
                    }
                });
            });
        }

        // Transform groups object to array
        const groupedResult: GroupedActionCategory[] = Object.entries(groups).map(([catId, data]) => {
            const categoryConfig = ACTION_CATEGORIES[catId as ActionCategory] || ACTION_CATEGORIES['Monitoramento'];

            const types: GroupedActionType[] = Object.entries(data.types).map(([typeId, count]) => ({
                id: typeId,
                label: typeId,
                count
            })).sort((a, b) => a.label.localeCompare(b.label));

            return {
                id: catId as ActionCategory,
                label: categoryConfig.label,
                count: data.count,
                color: categoryConfig.color,
                icon: categoryConfig.icon,
                types
            };
        }).sort((a, b) => a.label.localeCompare(b.label));

        return { filteredAcoesFeatures: features, groupedActions: groupedResult };
    }, [acoesData, dateFilter.startDate, dateFilter.endDate]);

    return {
        filteredDesmatamentoData,
        filteredFirms,
        filteredAcoesFeatures, // Flat list for map rendering
        groupedActions, // Hierarchical list for UI
    };
}