/**
 * Testes do Maestro (layerService.getLayer) — roteamento pós-colapso dos
 * STATIC_STRATEGIES (Candidato 2):
 * - Caminho R: sourceType='table' → resolveTableLayer (Dados de Base tri-scope)
 * - Caminho B: demais camadas → getGenericLayerData (layer_data JSONB)
 * - Camada inexistente no catálogo → null
 */

import { getLayer } from "@/lib/service/layerService";
import * as layerRepo from "@/lib/repositories/layerRepository";
import * as resolver from "@/lib/service/layer-resolver";

jest.mock("@/lib/repositories/layerRepository", () => ({
    getLayerCatalog: jest.fn(),
    getGenericLayerData: jest.fn(),
}));

jest.mock("@/lib/service/layer-resolver", () => ({
    resolveTableLayer: jest.fn(),
}));

jest.mock("@/db", () => ({
    db: {
        execute: jest.fn().mockResolvedValue({ rows: [] }),
        select: jest.fn().mockReturnValue({
            from: jest.fn().mockReturnValue({
                where: jest.fn().mockReturnValue({
                    orderBy: jest.fn().mockResolvedValue([])
                })
            })
        })
    }
}));

const TENANT = "real-1111-1111-1111-111111111111";

const mockCatalogAcoes = {
    id: 1,
    slug: "acoes",
    name: "Ações de Fiscalização",
    ordering: 1,
    scope: "region",
    visualConfig: { mapDisplay: "date_filter", groupByColumn: undefined },
    schemaConfig: { sourceType: "table", tableName: "acoes", geometryColumn: "geom", dateColumn: "time" },
};

const mockCatalogBacia = {
    id: 2,
    slug: "bacia_rio",
    name: "Bacia Rio",
    ordering: 2,
    scope: "tenant",
    visualConfig: { mapDisplay: "all" },
    schemaConfig: {},
};

const EMPTY = { type: "FeatureCollection", features: [] };

describe("MapLayerService - O Maestro", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("usa o Caminho R (resolveTableLayer) quando sourceType='table'", async () => {
        (layerRepo.getLayerCatalog as jest.Mock).mockResolvedValue(mockCatalogAcoes);
        (resolver.resolveTableLayer as jest.Mock).mockResolvedValue({
            type: "FeatureCollection",
            features: [{ type: "Feature", id: 99, geometry: { type: "Point", coordinates: [0, 0] }, properties: {} }],
        });

        const resultado = await getLayer("acoes", TENANT);

        expect(layerRepo.getLayerCatalog).toHaveBeenCalledWith("acoes");
        expect(resolver.resolveTableLayer).toHaveBeenCalledWith(
            mockCatalogAcoes.schemaConfig,
            "region",
            expect.objectContaining({ tenantId: TENANT }),
        );
        expect(layerRepo.getGenericLayerData).not.toHaveBeenCalled();
        expect(resultado?.name).toBe("Ações de Fiscalização");
        expect(resultado?.visualConfig?.dateFilter).toBe(true);
        expect(resultado?.data.features).toHaveLength(1);
    });

    it("usa o Caminho B (getGenericLayerData) para camadas de Organização", async () => {
        (layerRepo.getLayerCatalog as jest.Mock).mockResolvedValue(mockCatalogBacia);
        (layerRepo.getGenericLayerData as jest.Mock).mockResolvedValue(EMPTY);

        const resultado = await getLayer("bacia_rio", TENANT);

        expect(layerRepo.getGenericLayerData).toHaveBeenCalled();
        expect(resolver.resolveTableLayer).not.toHaveBeenCalled();
        expect(resultado?.slug).toBe("bacia_rio");
    });

    it("retorna null se a camada não existir no catálogo", async () => {
        (layerRepo.getLayerCatalog as jest.Mock).mockResolvedValue(null);

        const resultado = await getLayer("fantasma", TENANT);

        expect(resultado).toBeNull();
        expect(layerRepo.getGenericLayerData).not.toHaveBeenCalled();
        expect(resolver.resolveTableLayer).not.toHaveBeenCalled();
    });
});
