# Projeto Final da Sala de Situação

Este projeto utiliza **Next.js 15**, **Drizzle ORM**, **PostGIS** e **Leaflet.js** para manipulação e exibição de dados geoespaciais.

## 📌 Requisitos de Configuração

Para rodar o projeto, você precisa configurar as seguintes variáveis de ambiente:

```bash
NEXT_PUBLIC_SUPABASE_URL=<sua_supabase_url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<sua_supabase_anon_key>
DATABASE_URL=<sua_database_url>
```



# Em Contrução
/api/admin/routes.ts
- [X] Buscar a lista de tabelas existentes no banco
- [X] Listar todos os dados de uma tabela especifica
- [X] Editar uma linha especifica 
- [X] Excluir uma linha especifica 
- [ ] Inserir uma unica linha
- [ ] inserir varias linhas (CSV ou Geojson)

/components/admin-painel
- [X] Lista de tabelas no banco
- [X] Tabela de itens do banco
- [X] Icones de editar e excluir na tabela do banco
- [X] Botão/modal para inserir varios arquivos (CSV)
- [X] Botão/modal para inserir varios arquivos (Geojson)
- [X] Botão/modal para inserir um unico item na tabela
- [X] Modal para editar item

/components/map
- [ ] CustomLayer exibi os shapes
- [ ] Customlayer exibi as ações
- [ ] O map exibi os shapes e ações marcados
- [ ] Modal para mais informações dos shapes ou ações

/context/map
- [ ] Contexto para administrar exibição dos shapes/ações

/api/map
- [ ] Listar todos os itens com exceção das ações
- [ ] Agrupar e listar as ações por categorias
- [ ] Buscar mais informações do ponto ou shape especifico

/components/dashboard
- [X] Componente Principal Dashboard
- [X] Grafico Fogo
- [X] Grafico Desmatamento
- [X] Grafico Ações
- [X] Grafico Pontos Deque de pedras
    - [X] Grafico Chuva
    - [X] Grafico Turbidez
- [X] Grafico Pontos Ponte do Cure
    - [X] Grafico Chuva
    - [X] Grafico Cristalino
    - [X] Grafico Nivel do rio

/api/dashboard
- [ ] Get dados de fogo
- [ ] Get dados de desmatamento
- [ ] Get dados de chuva
- [ ] Get dados de Cristalino
- [ ] Get dados de Nivel do rio
- [ ] Filtro por ano



---

## 📊 Estrutura das Tabelas Geoespaciais

| Tabela                 | Geometry Column | SRID     | Tipo de Geometria  | Observação |
|------------------------|----------------|---------|-------------------|------------|
| Bacia_Rio_Da_Prata     | geom           | 4326    | MULTIPOLYGON     |            |
| Banhado_Rio_Da_Prata   | geom           | 4326    | MULTIPOLYGON     |            |
| Leito_Rio_Da_Prata     | geom           | 4326    | MULTILINESTRING  |            |
| Acoes                  | geom           | 4326    | POINT            |            |
| Deque de pedras        | Não é necessário | Não é necessário | Não é necessário  |            |
| Desmatamento           | geom           | 4326    | GEOMETRY         |            |
| Estradas               | geom           | 4326    | GEOMETRY         |            |
| Ponte do Cure          | Não é necessário | Não é necessário | Não é necessário  |            |
| Propriedades           | geom           | 4326    | MULTIPOLYGON     |            |
| Raw Firms              | geom           | 4326    | POINT            |            |


Banhado - Leito e Bacia
ID, name, area, geom

Acoes
"id","name","latitude","longitude","elevation","time","descricao","mes","atuacao","acao","geom"

Deque de pedras
"id","local","mes","data","turbidez","secchi_vertical","secchi_horizontal","chuva"

Desmatamento
"id","alertid","alertcode","alertha","source","detectat","detectyear","state","stateha","geom"

Estradas
"id","nome","tipo","codigo","geom"

Ponte do cure
"id","local","mes","data","chuva","nivel","visibilidade"

propriedades
"id","cod_tema","nom_tema","cod_imovel","mod_fiscal","num_area","ind_status","ind_tipo","des_condic","municipio","geom"

raw_firms
"latitude","longitude","bright_ti4","scan","track","acq_date","acq_time","satellite","instrument","confidence","version","bright_ti5","frp","daynight","type","hora_deteccao","geom"


---

## 📂 Estrutura do Projeto

O projeto segue uma estrutura modular para manter a organização e escalabilidade.

### 📁 **Backend (APIs)**

```plaintext
app/
└── api/
    ├── postgis/
    │   ├── route.ts       # Endpoints gerais para PostGIS
    ├── dashboard/          # Dados para dashboards
    │   ├── route.ts      
    ├── admin/             # Operações administrativas
    │   ├── add-item/
            ├──route.ts
    │   ├── delete-item/
            ├──route.ts
    │   ├── table-data/
            ├──route.ts
    │   ├── table-fields/
            ├──route.ts
    │   ├── tables/
            ├──route.ts
    │   ├── update-item/
            ├──route.ts
    ├── authentication/
        ├── actions.ts       # Autenticação de usuários
```

### 📁 **Banco de Dados** (Drizzle ORM e PostGIS)

```plaintext
src/
└── db/
    ├── drizzle.ts         # Configuração do Drizzle ORM
    ├── schema.ts          # Definição das tabelas
```

### 📁 **Utilidades e Funções Auxiliares**

```plaintext
src/
└── lib/
    ├── utils.ts           # Funções auxiliares
```

---

## 🚀 Como Rodar o Projeto

### 1️⃣ **Instalar Dependências**
```bash
yarn install
# ou
npm install
```

### 2️⃣ **Rodar o Servidor de Desenvolvimento**
```bash
yarn dev
# ou
npm run dev
```

### 3️⃣ **Rodar as Migrações do Banco**
Caso esteja utilizando Drizzle ORM, rode:
```bash
yarn drizzle migrate
# ou
npm run drizzle migrate
```

---

## 🛠 Tecnologias Utilizadas
- **Next.js 15** (API Routes e Server Actions)
- **Drizzle ORM** (Gerenciamento do banco de dados)
- **PostGIS** (Dados geoespaciais)
- **Supabase** (Autenticação e storage)
- **Leaflet.js/react-leaflet** (Mapas interativos)

Caso tenha alguma dúvida ou sugestão, entre em contato! 🚀

