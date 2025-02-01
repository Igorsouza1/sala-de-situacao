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
- [ ] Editar uma linha especifica
- [ ] Excluir uma linha especifica
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

---

## 📂 Estrutura do Projeto

O projeto segue uma estrutura modular para manter a organização e escalabilidade.

### 📁 **Backend (APIs)**

```plaintext
app/
└── api/
    ├── postgis/
    │   ├── route.ts       # Endpoints gerais para PostGIS
    ├── dashboard/
    │   ├── route.ts       # Dados para dashboards
    ├── admin/
    │   ├── route.ts       # Operações administrativas
    ├── authentication/
        ├── route.ts       # Autenticação de usuários
```

### 📁 **Banco de Dados** (Drizzle ORM e PostGIS)

```plaintext
src/
└── db/
    ├── drizzle.ts         # Configuração do Drizzle ORM
    ├── schema.ts          # Definição das tabelas
    ├── postgis.ts         # Funções para manipular PostGIS
    ├── dashboard.ts       # Funções para dashboards
    ├── admin.ts           # Funções administrativas
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
- **Leaflet.js** (Mapas interativos)

Caso tenha alguma dúvida ou sugestão, entre em contato! 🚀

