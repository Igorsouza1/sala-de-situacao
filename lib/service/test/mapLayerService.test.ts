

import { getLayer } from "@/lib/service/layerService";

// 1. IMPORTAMOS AS FUNÇÕES QUE VAMOS "MOCKAR" (Fingir)
// É importante importar como * para poder espionar/substituir as funções
import * as layerRepo from "@/lib/repositories/layerRepository";
import * as acoesRepo from "@/lib/repositories/acoesRepository";

// 2. DIZEMOS AO JEST PARA "MOCKAR" OS ARQUIVOS
// Isso impede que o teste tente conectar no banco de dados real!
jest.mock("@/lib/repositories/layerRepository");
jest.mock("@/lib/repositories/acoesRepository");

// DADOS FALSOS PARA O TESTE (FIXTURES)
const mockCatalogAcoes = {
    id: 1,
    slug: "acoes",
    name: "Ações de Fiscalização",
    ordering: 1,
    visualConfig: { mapDisplay: "date_filter", color: "red" },
    schemaConfig: {},
};

const mockCatalogBacia = {
    id: 2,
    slug: "bacia_rio",
    name: "Bacia Rio",
    ordering: 2,
    visualConfig: { mapDisplay: "all", color: "blue" },
    schemaConfig: {},
};

describe("MapLayerService - O Maestro", () => {

    // Antes de cada teste, limpamos os mocks para não sobrar lixo de um teste no outro
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // --- CENÁRIO 1: CAMADA VIP (ESTÁTICA) ---
    it("deve usar a Estratégia VIP quando o slug for 'acoes'", async () => {
        // A. PREPARAÇÃO (ARRANGE)
        // Ensinamos o Mock do Catálogo a retornar a configuração de 'acoes'
        (layerRepo.getLayerCatalog as jest.Mock).mockResolvedValue(mockCatalogAcoes);

        // Ensinamos o Mock do Repositório de Ações a retornar dados falsos
        (acoesRepo.findAllAcoesDataWithGeometry as jest.Mock).mockResolvedValue([
            { id: 99, geom: { type: "Point", coordinates: [0, 0] }, categoria: "Teste" }
        ]);

        // B. AÇÃO (ACT)
        // Chamamos a função real do Service
        const resultado = await getLayer("acoes");

        // C. VERIFICAÇÃO (ASSERT)

        // Verificamos se ele chamou o catálogo
        expect(layerRepo.getLayerCatalog).toHaveBeenCalledWith("acoes");

        // O PULO DO GATO: Verificamos se ele chamou o REPOSITÓRIO ESPECÍFICO DE AÇÕES
        expect(acoesRepo.findAllAcoesDataWithGeometry).toHaveBeenCalled();

        // Verificamos se ele NÃO chamou o genérico
        expect(layerRepo.getLayerGeoJSON).not.toHaveBeenCalled();

        // Verificamos se o resultado final está montado corretamente (DTO)
        expect(resultado).not.toBeNull();
        expect(resultado?.name).toBe("Ações de Fiscalização");
        expect(resultado?.visualConfig?.dateFilter).toBe(true); // Regra do date_filter
        expect(resultado?.data.features).toHaveLength(1);
    });

    // --- CENÁRIO 2: CAMADA GENÉRICA ---
    it("deve usar o Repositório Genérico quando o slug for desconhecido (ex: 'bacia_rio')", async () => {
        // A. PREPARAÇÃO
        (layerRepo.getLayerCatalog as jest.Mock).mockResolvedValue(mockCatalogBacia);

        // Ensinamos o genérico a retornar um GeoJSON
        (layerRepo.getLayerGeoJSON as jest.Mock).mockResolvedValue({
            type: "FeatureCollection",
            features: []
        });

        // B. AÇÃO
        const resultado = await getLayer("bacia_rio");

        // C. VERIFICAÇÃO
        expect(layerRepo.getLayerCatalog).toHaveBeenCalledWith("bacia_rio");

        // Verifica se chamou o GENÉRICO
        expect(layerRepo.getLayerGeoJSON).toHaveBeenCalledWith("bacia_rio");

        // Garante que NÃO chamou o de ações
        expect(acoesRepo.findAllAcoesDataWithGeometry).not.toHaveBeenCalled();

        expect(resultado?.slug).toBe("bacia_rio");
    });

    // --- CENÁRIO 3: ERRO / NÃO ENCONTRADO ---
    it("deve retornar null se a camada não existir no catálogo", async () => {
        // A. PREPARAÇÃO
        (layerRepo.getLayerCatalog as jest.Mock).mockResolvedValue(null);

        // B. AÇÃO
        const resultado = await getLayer("fantasma");

        // C. VERIFICAÇÃO
        expect(resultado).toBeNull();
        // Garante que não tentou buscar dados se nem existe no catálogo
        expect(layerRepo.getLayerGeoJSON).not.toHaveBeenCalled();
    });
});