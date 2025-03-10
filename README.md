# Sala de Situação - Monitoramento Geoespacial

O **Sala de Situação** é um sistema de monitoramento geoespacial que permite a visualização e análise de dados ambientais, como desmatamento, incêndios e ações de preservação. O projeto utiliza **Next.js 15**, **Drizzle ORM**, **PostGIS** e **Leaflet.js** para exibição e manipulação de dados geoespaciais.

Com a sala conseguimos analisar dados georeferenciados como pontos de ações realizadas pelo IHP, passivos ambientais, vestigios de pesca ou crimes ambientais.
Reunimos em 1 só lugar dados de focos de incendio, desmatamento para que seja possivel tomar decisões mais acertadas. 
A plataforma gerencia todos os seus dados para que voce se concentre na tomada de decisões relevantes no longo prazo.

## 📌 Requisitos de Configuração

Para rodar o projeto, você precisa configurar as seguintes variáveis de ambiente:

```bash
NEXT_PUBLIC_SUPABASE_URL=<sua_supabase_url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<sua_supabase_anon_key>
DATABASE_URL=<sua_database_url>
```

---

## 🚧 Funcionalidades em Desenvolvimento

### 📌 **API Admin (`/api/admin/routes.ts`)**
✅ Buscar lista de tabelas  
✅ Listar dados de uma tabela específica  
✅ Editar uma linha específica  
✅ Excluir uma linha específica  
⏳ Inserir uma única linha  
⏳ Inserir várias linhas (CSV ou GeoJSON)

### 📌 **Painel Administrativo (`/components/admin-painel`)**
✅ Lista de tabelas no banco  
✅ Tabela de itens do banco  
✅ Ícones de editar e excluir na tabela  
✅ Modal para inserção de CSV e GeoJSON  
✅ Modal para inserir um único item  
✅ Modal para editar um item  

### 📌 **Mapa (`/components/map`)**
✅ Exibir shapes no `CustomLayer` 
✅ Exibir ações no `CustomLayer`  
✅ Exibir shapes e ações marcados no mapa
✅ Modal com mais informações  
✅ Componente de Filtragem por data

### 📌 **Contexto Mapa (`/context/mapContext`)**
✅ Concentrar informações dos shapes
✅ Concentrar informações dos açoes


### 📌 **API do Mapa (`/api/map`)**
✅ Listar todos os itens (exceto ações) 
✅ Agrupar e listar ações por categoria  
✅ Buscar mais informações de um ponto ou shape específico  

### 📌 **Dashboard (`/components/dashboard`)**
✅ Dashboard principal  
✅ Gráficos de fogo, desmatamento e ações  
✅ Gráficos ambientais (`Deque de pedras`, `Ponte do Cure`)  

### 📌 **API do Dashboard (`/api/dashboard`)**
✅ Buscar dados de fogo  
✅ Buscar dados de desmatamento  
✅ Buscar dados de chuva  
✅ Buscar dados do rio  

---

## 💊 Estrutura das Tabelas Geoespaciais

| Tabela                 | Geometry Column | SRID  | Tipo de Geometria  | Observação |
|------------------------|----------------|-------|--------------------|------------|
| Bacia_Rio_Da_Prata     | geom           | 4326  | MULTIPOLYGON      |            |
| Banhado_Rio_Da_Prata   | geom           | 4326  | MULTIPOLYGON      |            |
| Leito_Rio_Da_Prata     | geom           | 4326  | MULTILINESTRING   |            |
| Acoes                  | geom           | 4326  | POINT             |            |
| Deque de pedras        | -              | -     | -                 |            |
| Desmatamento           | geom           | 4326  | GEOMETRY          |            |
| Estradas               | geom           | 4326  | GEOMETRY          |            |
| Ponte do Cure          | -              | -     | -                 |            |
| Propriedades           | geom           | 4326  | MULTIPOLYGON      |            |
| Raw Firms              | geom           | 4326  | POINT             |            |

---

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




## 💽 Estrutura do Projeto

### 📁 **Backend (APIs)**

```plaintext
app/
└── api/
    ├── postgis/
    │   ├── route.ts       # Endpoints gerais para PostGIS
    ├── dashboard/         # Dados para dashboards
    │   ├── route.ts      
    ├── admin/             # Operações administrativas
    │   ├── add-item/
            ├── route.ts
    │   ├── delete-item/
            ├── route.ts
    │   ├── table-data/
            ├── route.ts
    │   ├── table-fields/
            ├── route.ts
    │   ├── tables/
            ├── route.ts
    │   ├── update-item/
            ├── route.ts
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

