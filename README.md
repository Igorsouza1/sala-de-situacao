Projeto Final da sala de situação

Precisa das chaves de API
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
DATABASE_URL



## Estrutura das Tabelas Geoespaciais

| Tabela                 | Geometry Column | SRID     | Tipo de Geometria  | Observação |
|------------------------|----------------|---------|-------------------|------------|
| Bacia_Rio_Da_Prata     | geom             | 4326    | MULTIPOLYGON     |            |
| Banhado_Rio_Da_Prata   | geom             | 4326    | MULTIPOLYGON     |            |
| Leito_Rio_Da_Prata     | geom             | 4326    | MULTILINESTRING  |            |
| Acoes                  | geom            | 4326    | POINT             | |
| Deque de pedras        | Não é necessario | Não é necessario | Não é necessario  | 
| Desmatamento           | geom         | 4326    | GEOMETRY         |              |
| Estradas               | geom             | 4326    | GEOMETRY         |            |
| Ponte do Cure          | Não é necessario | Não é necessario | Não é necessario  | |
| Propriedades           | geom             | 4326    | MULTIPOLYGON     |            |
| Raw Firms              | geom         | 4326    | POINT            |            |

### Observações:
- **Tabelas sem Geometry Column** precisam ser corrigidas (`Acoes`, `Deque de pedras`, `Ponte do Cure`).
- **Tabelas com SRID diferente** (`Leito_Rio_Da_Prata` - 31981, `desmatamento` e `raw_firms` - 4674).
- **Possíveis tabelas duplicadas** (`desmatamento`, `estradas`).
- **Índices espaciais podem ser adicionados para otimizar consultas PostGIS**.

### Índice Espacial no PostGIS:
Para melhorar a performance das buscas geoespaciais, execute:
```sql
CREATE INDEX spatial_index ON nome_da_tabela USING GIST(geometry_column);

