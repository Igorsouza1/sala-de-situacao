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



