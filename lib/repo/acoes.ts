import { acoesInRioDaPrata } from "@/db/schema"
import { criarRepositorio } from "./base-repo"

// Interface para o tipo Ação
export interface Acao {
  id: number
  titulo: string
  descricao: string
  data: string
  status: string
  tipo: string
  geom?: any
  latitude?: number
  longitude?: number
  [key: string]: any
}

// Criar instância do repositório
const acoesRepo = criarRepositorio<Acao>(acoesInRioDaPrata, "acoes")

// Exportar funções específicas
export const listarAcoes = () => acoesRepo.listar()
export const buscarAcaoPorId = (id: number) => acoesRepo.buscarPorId(id)
export const criarAcao = (data: Partial<Acao>) => acoesRepo.criarComGeometria(data)
export const atualizarAcao = (id: number, data: Partial<Acao>) => acoesRepo.atualizar(id, data)
export const removerAcao = (id: number) => acoesRepo.remover(id)

// Funções específicas para ações
export const buscarAcoesPorStatus = (status: string) => 
  acoesRepo.buscarComFiltros({ status })

export const buscarAcoesPorTipo = (tipo: string) => 
  acoesRepo.buscarComFiltros({ tipo })

export const buscarAcoesPorData = (dataInicio: string, dataFim: string) => {
  // Implementação específica para busca por intervalo de datas
  return acoesRepo.listar() // Placeholder - implementar filtro por data
}
