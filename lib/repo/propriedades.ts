import { propriedadesInRioDaPrata } from "@/db/schema"
import { criarRepositorio } from "./base-repo"

// Interface para o tipo Propriedade
export interface Propriedade {
  id: number
  nome: string
  proprietario: string
  area: number
  geom?: any
  latitude?: number
  longitude?: number
  [key: string]: any
}

// Criar instância do repositório
const propriedadesRepo = criarRepositorio<Propriedade>(propriedadesInRioDaPrata, "propriedades")

// Exportar funções específicas
export const listarPropriedades = () => propriedadesRepo.listar()
export const buscarPropriedadePorId = (id: number) => propriedadesRepo.buscarPorId(id)
export const criarPropriedade = (data: Partial<Propriedade>) => propriedadesRepo.criarComGeometria(data)
export const atualizarPropriedade = (id: number, data: Partial<Propriedade>) => propriedadesRepo.atualizar(id, data)
export const removerPropriedade = (id: number) => propriedadesRepo.remover(id)

// Funções específicas para propriedades
export const buscarPropriedadesPorProprietario = (proprietario: string) => 
  propriedadesRepo.buscarComFiltros({ proprietario })

export const buscarPropriedadesPorNome = (nome: string) => 
  propriedadesRepo.buscarComFiltros({ nome })
