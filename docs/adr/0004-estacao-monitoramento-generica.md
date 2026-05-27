# Estações de monitoramento generalizadas por Organização

As tabelas hardcoded `deque_de_pedras`, `balneario_municipal` e `ponte_do_cure` serão substituídas por um modelo genérico de Estação de Monitoramento, onde cada Organização configura suas próprias estações com schema de medições customizável (JSONB). A decisão foi tomada porque hardcodar nomes de estações no schema impede qualquer Organização além de Bonito-MS de usar a funcionalidade, e o padrão de schema JSONB já existe no sistema via `layer_catalog`.

## Considered Options

- **Tabelas hardcoded por estação** (atual): simples, mas específico de Bonito-MS. Não escala para outros clientes.
- **Estação de Monitoramento genérica com schema JSONB** (escolhido): cada Org configura suas estações; suporta integração com fontes externas como Wunderground; requer migração dos dados existentes.
