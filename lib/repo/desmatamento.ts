import { desmatamentoInRioDaPrata } from "@/db/schema"
import { criarRepositorio } from "./base-repo"

// Interface para o tipo Desmatamento
export interface Desmatamento {
  id: number
  data: string
  area: number
  tipo: string
  geom?: any
  latitude?: number
  longitude?: number
  [key: string]: any
}

// Criar instância do repositório
const desmatamentoRepo = criarRepositorio<Desmatamento>(desmatamentoInRioDaPrata, "desmatamento")

// Exportar funções específicas
export const listarDesmatamento = () => desmatamentoRepo.listar()
export const buscarDesmatamentoPorId = (id: number) => desmatamentoRepo.buscarPorId(id)
export const criarDesmatamento = (data: Partial<Desmatamento>) => desmatamentoRepo.criarComGeometria(data)
export const atualizarDesmatamento = (id: number, data: Partial<Desmatamento>) => desmatamentoRepo.atualizar(id, data)
export const removerDesmatamento = (id: number) => desmatamentoRepo.remover(id)

// Funções específicas para desmatamento
export const buscarDesmatamentoPorTipo = (tipo: string) => 
  desmatamentoRepo.buscarComFiltros({ tipo })

export const buscarDesmatamentoPorData = (data: string) => 
  desmatamentoRepo.buscarComFiltros({ data })
