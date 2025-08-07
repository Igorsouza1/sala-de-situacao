# Repositórios de Dados

Este diretório contém os repositórios para acesso aos dados do sistema, organizados de forma modular e tipada.

## Estrutura

### Repositório Base (`base-repo.ts`)
- Classe base para operações CRUD genéricas
- Suporte a operações com geometria (latitude/longitude)
- Filtros dinâmicos

### Repositório Genérico (`generic-repo.ts`)
- Operações genéricas para qualquer tabela
- Usado pelas rotas admin para operações dinâmicas
- Suporte completo a CRUD

### Repositórios Específicos
- `acoes.ts` - Operações específicas para ações
- `desmatamento.ts` - Operações específicas para desmatamento
- `propriedades.ts` - Operações específicas para propriedades
- `deque-pedras.ts` - Operações específicas para deque de pedras

## Como Usar

### Usando Repositórios Específicos

```typescript
import { listarAcoes, criarAcao, buscarAcaoPorId } from '@/lib/repo/acoes'

// Listar todas as ações
const acoes = await listarAcoes()

// Criar uma nova ação
const novaAcao = await criarAcao({
  titulo: "Nova Ação",
  descricao: "Descrição da ação",
  data: "2024-01-01",
  status: "pendente",
  tipo: "monitoramento",
  latitude: -23.5505,
  longitude: -46.6333
})

// Buscar ação por ID
const acao = await buscarAcaoPorId(1)
```

### Usando Repositório Genérico

```typescript
import { genericRepo } from '@/lib/repo/generic-repo'

// Listar tabelas disponíveis
const tabelas = await genericRepo.listarTabelas()

// Listar campos de uma tabela
const campos = await genericRepo.listarCampos('acoes')

// Operações CRUD genéricas
const dados = await genericRepo.listarDados('acoes')
const item = await genericRepo.buscarPorId('acoes', 1)
const novoItem = await genericRepo.criar('acoes', { titulo: 'Teste' })
const itemAtualizado = await genericRepo.atualizar('acoes', 1, { titulo: 'Novo Título' })
const removido = await genericRepo.remover('acoes', 1)
```

### Criando Novos Repositórios

Para criar um novo repositório específico:

```typescript
import { tabelaInRioDaPrata } from "@/db/schema"
import { criarRepositorio } from "./base-repo"

// Interface para o tipo
export interface MeuTipo {
  id: number
  nome: string
  // ... outros campos
}

// Criar instância do repositório
const meuRepo = criarRepositorio<MeuTipo>(tabelaInRioDaPrata, "nome_da_tabela")

// Exportar funções específicas
export const listarMeusDados = () => meuRepo.listar()
export const criarMeuDado = (data: Partial<MeuTipo>) => meuRepo.criarComGeometria(data)
export const atualizarMeuDado = (id: number, data: Partial<MeuTipo>) => meuRepo.atualizar(id, data)
export const removerMeuDado = (id: number) => meuRepo.remover(id)
```

## Rotas API

### Rotas Genéricas (Admin)
- `GET /api/admin/tables` - Listar tabelas
- `GET /api/admin/table-fields?table=nome` - Listar campos de uma tabela
- `GET /api/admin/table-data?table=nome` - Listar dados de uma tabela
- `POST /api/admin/add-item?table=nome` - Criar item
- `PUT /api/admin/update-item?table=nome` - Atualizar item
- `DELETE /api/admin/delete-item?table=nome` - Remover item

### Rotas Específicas
- `GET /api/admin/acoes` - Operações CRUD para ações
- `GET /api/admin/acoes?id=1` - Buscar ação específica
- `GET /api/admin/acoes?status=pendente` - Filtrar por status
- `GET /api/admin/acoes?tipo=monitoramento` - Filtrar por tipo

## Vantagens da Arquitetura

1. **Separação de Responsabilidades**: Lógica de acesso a dados isolada
2. **Reutilização**: Funções comuns centralizadas
3. **Tipagem**: TypeScript para melhor desenvolvimento
4. **Flexibilidade**: Repositórios específicos e genéricos
5. **Manutenibilidade**: Mudanças centralizadas
6. **Testabilidade**: Fácil de testar isoladamente
