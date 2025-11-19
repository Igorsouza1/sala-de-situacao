// hooks/useMapFilters.ts

import { useMemo } from "react";
import { isDatePropWithinRange } from "@/lib/helpers/map-filters"; 
import { useMapContext } from "@/context/GeoDataContext";

// --- Constantes Extraídas de components/map/map.tsx ---
// (Em um futuro PR, moveremos estas constantes para um arquivo de config)
const actionColors: Record<string, string> = {
    "Fazenda": "#2ecc71",
    "Passivo Ambiental": "#f1c40f",
    Pesca: "#3498db",
    "Pesca - Crime Ambiental": "#9b59b6",
    "Ponto de Referência": "#e67e22",
    "Crime Ambiental": "#e74c3c",
    Nascente: "#1abc9c",
    Plantio: "#16a085",
    "Régua Fluvial": "#95a5a6",
    expedicoes: "orange",
    "Não informado": "#7f8c8d",
}
type GeoJSONFeatureCollection = { type: "FeatureCollection", features: any[] };

// --- Tipagens do Hook ---
interface MapFiltersInput {
    mapData: ReturnType<typeof useMapContext>['mapData'];
    acoesData: ReturnType<typeof useMapContext>['acoesData'];
    expedicoesData: ReturnType<typeof useMapContext>['expedicoesData'];
    dateFilter: ReturnType<typeof useMapContext>['dateFilter'];
}

interface ActionOption {
    id: string
    label: string
    count: number
    color: string
}

export function useMapFilters({ mapData, acoesData, expedicoesData, dateFilter }: MapFiltersInput) {

    // 1. FILTERED DESMATAMENTO DATA (Lógica original de components/map/map.tsx)
    const filteredDesmatamentoData = useMemo(() => {
        if (mapData && mapData.desmatamento) {
            return {
                type: "FeatureCollection",
                features: mapData.desmatamento.features.filter((feature: any) =>
                    isDatePropWithinRange(feature.properties.detectat, dateFilter.startDate, dateFilter.endDate),
                ),
            } as GeoJSONFeatureCollection
        }
        return null
    }, [mapData, dateFilter.startDate, dateFilter.endDate])

    // 2. FILTERED FIRMS DATA (Lógica original de components/map/map.tsx)
    const filteredFirms = useMemo(() => {
        if (!mapData) return []
        return mapData.firms.features.filter((firm: any) =>
            isDatePropWithinRange(firm.properties.acq_date, dateFilter.startDate, dateFilter.endDate),
        )
    }, [mapData, dateFilter.startDate, dateFilter.endDate])

    // 3. FILTERED AÇÕES (Lógica original de components/map/map.tsx)
    const filteredAcoes = useMemo(() => {
        const newResult: Record<string, GeoJSONFeatureCollection> = {};
        if (!acoesData) {
            return newResult;
        }

        Object.entries(acoesData).forEach(([acaoType, featureCollection]) => {
            const filteredFeatures = featureCollection.features.filter((feature: any) => {
                if (!feature.properties || !feature.properties.time) {
                    return false;
                }
                return isDatePropWithinRange(feature.properties.time, dateFilter.startDate, dateFilter.endDate);
            });

            if (filteredFeatures.length > 0) {
                newResult[acaoType] = {
                    ...featureCollection,
                    features: filteredFeatures,
                };
            }
        });
        return newResult;
    }, [acoesData, dateFilter.startDate, dateFilter.endDate]);

    // 4. ACTION OPTIONS (Lógica original de components/map/map.tsx)
    const actionOptions = useMemo(() => {
        const opts: ActionOption[] = []
        
        if (expedicoesData) {
            const trilhasFiltradas = expedicoesData.trilhas.features.filter((f: any) =>
                isDatePropWithinRange(f.properties.data, dateFilter.startDate, dateFilter.endDate)
            )
            const waypointsFiltrados = expedicoesData.waypoints.features.filter((f: any) =>
                isDatePropWithinRange(f.properties.data, dateFilter.startDate, dateFilter.endDate)
            )

            const count = trilhasFiltradas.length + waypointsFiltrados.length
            if (count > 0) {
                opts.unshift({ id: "expedicoes", label: "Expedições", count, color: actionColors.expedicoes || "#000" })
            }
        }
        
        if (filteredAcoes) {
            Object.entries(filteredAcoes).forEach(([acao, fc]) => {
                opts.push({ id: acao, label: acao, count: fc.features.length, color: actionColors[acao] || "#000" })
            })
        }
        return opts
    }, [filteredAcoes, expedicoesData, dateFilter]);


    return {
        filteredDesmatamentoData,
        filteredFirms,
        filteredAcoes,
        actionOptions,
    };
}