import { pgTable, serial, geometry, bigint, doublePrecision, integer, varchar, numeric, text, timestamp, date, foreignKey, unique, time, uuid } from "drizzle-orm/pg-core"
import { type InferInsertModel, type InferSelectModel } from 'drizzle-orm';


// NEW: Tabela para gerenciar as diferentes regiões (bacias, municípios, etc.)
export const regioes = pgTable("regioes", {
	id: serial("id").primaryKey().notNull(),
	nome: varchar("nome", { length: 255 }).notNull(),
    descricao: text("descricao"),
	geom: geometry({ type: "multipolygon", srid: 4326 }), // Polígono que delimita a região
});

// NEW: Tabela para os pontos de monitoramento (substitui deque_de_pedras e ponte_do_cure)
export const pontosMonitoramento = pgTable("pontos_monitoramento", {
    id: serial("id").primaryKey().notNull(),
    regiaoId: integer("regiao_id").notNull().references(() => regioes.id, { onDelete: 'cascade' }),
    nome: varchar("nome", { length: 255 }).notNull(),
    descricao: text("descricao"),
    geom: geometry({ type: "point", srid: 4326 }).notNull(), // Ponto geográfico do local
});

// NEW: Tabela para os registros de monitoramento (dados de turbidez, nível, etc.)
export const registrosMonitoramento = pgTable("registros_monitoramento", {
    id: serial("id").primaryKey().notNull(),
    pontoId: integer("ponto_id").notNull().references(() => pontosMonitoramento.id, { onDelete: 'cascade' }),
    parametro: varchar("parametro", { length: 100 }).notNull(), // Ex: 'turbidez', 'chuva', 'nivel_rio'
    valor: numeric("valor", { precision: 10, scale: 2 }).notNull(),
    unidade: varchar("unidade", { length: 20 }), // Ex: 'NTU', 'mm', 'm'
    dataOcorrencia: timestamp("data_ocorrencia", { mode: 'string' }).notNull(),
});


// Tabela de exemplo que já existia, agora com `regiaoId`
export const baciaRioDaPrata = pgTable("Bacia_Rio_Da_Prata", {
	id: serial().primaryKey().notNull(),
    regiaoId: integer("regiao_id").references(() => regioes.id, { onDelete: 'set null' }),
	geom: geometry({ type: "multipolygon", srid: 4326 }),
	hybasId: bigint("hybas_id", { mode: "number" }),
	nextDown: bigint("next_down", { mode: "number" }),
	nextSink: bigint("next_sink", { mode: "number" }),
	mainBas: bigint("main_bas", { mode: "number" }),
	distSink: doublePrecision("dist_sink"),
	distMain: doublePrecision("dist_main"),
	subArea: doublePrecision("sub_area"),
	upArea: doublePrecision("up_area"),
	pfafId: bigint("pfaf_id", { mode: "number" }),
	endo: integer(),
	coast: integer(),
	order: integer("order_"),
	sort: integer(),
});

export const banhadoRioDaPrata = pgTable("Banhado_Rio_Da_Prata", {
	id: bigint({ mode: "number" }).primaryKey().notNull(),
    regiaoId: integer("regiao_id").references(() => regioes.id, { onDelete: 'set null' }),
	geom: geometry({ type: "multipolygon", srid: 4326 }),
});

export const leitoRioDaPrata = pgTable("Leito_Rio_Da_Prata", {
	id: serial().primaryKey().notNull(),
    regiaoId: integer("regiao_id").references(() => regioes.id, { onDelete: 'set null' }),
	geom: geometry({ type: "multilinestringz", srid: 4326 }),
	name: varchar({ length: 254 }),
});


export const trilhas = pgTable("trilhas", {
	id: serial().primaryKey().notNull(),
    regiaoId: integer("regiao_id").notNull().references(() => regioes.id, { onDelete: 'cascade' }),
	nome: text().notNull(),
	geom: geometry({ type: "multilinestringz", srid: 4326 }).notNull(),
	dataInicio: timestamp("data_inicio", { mode: 'string' }),
	dataFim: timestamp("data_fim", { mode: 'string' }),
	duracaoMinutos: integer("duracao_minutos"),
});
export type NewTrilhaData = InferInsertModel<typeof trilhas>;


export const desmatamento = pgTable("desmatamento", {
	id: serial().primaryKey().notNull(),
    regiaoId: integer("regiao_id").notNull().references(() => regioes.id, { onDelete: 'cascade' }),
	alertid: text(),
	alertcode: text(),
	alertha: doublePrecision(),
	source: text(),
	detectat: text(),
	detectyear: integer(),
	state: text(),
	stateha: doublePrecision(),
	geom: geometry({ type: "geometry", srid: 4326 }),
});

export const propriedades = pgTable("propriedades", {
	id: serial().primaryKey().notNull(),
    regiaoId: integer("regiao_id").notNull().references(() => regioes.id, { onDelete: 'cascade' }),
	codTema: varchar("cod_tema", { length: 50 }),
	nomTema: varchar("nom_tema", { length: 100 }),
	codImovel: varchar("cod_imovel", { length: 100 }),
	modFiscal: doublePrecision("mod_fiscal"),
	numArea: doublePrecision("num_area"),
	indStatus: varchar("ind_status", { length: 20 }),
	indTipo: varchar("ind_tipo", { length: 20 }),
	desCondic: text("des_condic"),
	municipio: varchar({ length: 100 }),
	geom: geometry({ type: "multipolygon", srid: 4326 }),
});

export const estradas = pgTable("estradas", {
	id: serial().primaryKey().notNull(),
    regiaoId: integer("regiao_id").notNull().references(() => regioes.id, { onDelete: 'cascade' }),
	nome: varchar({ length: 255 }),
	tipo: varchar({ length: 100 }),
	codigo: varchar({ length: 50 }),
	geom: geometry({ type: "multilinestringz", srid: 4326 })
});
export type NewEstradaData = InferInsertModel<typeof estradas>;


export const waypoints = pgTable("waypoints", {
	id: serial().primaryKey().notNull(),
	trilhaId: integer("trilha_id").notNull().references(() => trilhas.id, { onDelete: 'cascade' }),
	nome: text(),
	geom: geometry({ type: "pointz", srid: 4326 }).notNull(),
	ele: doublePrecision(),
	recordedat: timestamp({ mode: 'string' }),
});
export type NewWaypointData = InferInsertModel<typeof waypoints>;


export const rawFirms = pgTable("raw_firms", {
	id: uuid().defaultRandom().primaryKey().notNull(),
    regiaoId: integer("regiao_id").notNull().references(() => regioes.id, { onDelete: 'cascade' }),
	latitude: doublePrecision(),
	longitude: doublePrecision(),
	brightTi4: doublePrecision("bright_ti4"),
	scan: doublePrecision(),
	track: doublePrecision(),
	acqDate: date("acq_date"),
	acqTime: text("acq_time"),
	satellite: text(),
	instrument: text(),
	confidence: text(),
	version: text(),
	brightTi5: doublePrecision("bright_ti5"),
	frp: doublePrecision(),
	daynight: text(),
	type: text(),
	horaDeteccao: time("hora_deteccao"),
	geom: geometry({ type: "point", srid: 4674 }),
});


export const acoes = pgTable("acoes", {
	id: serial().primaryKey().notNull(),
    regiaoId: integer("regiao_id").notNull().references(() => regioes.id, { onDelete: 'cascade' }),
	name: varchar({ length: 255 }),
	latitude: numeric({ precision: 10, scale:  6 }),
	longitude: numeric({ precision: 10, scale:  6 }),
	elevation: numeric({ precision: 8, scale:  2 }),
	time: timestamp({ mode: 'string' }),
	descricao: varchar({ length: 255 }),
	mes: varchar({ length: 50 }),
	atuacao: varchar({ length: 100 }),
	acao: varchar({ length: 100 }),
	geom: geometry({ type: "point", srid: 4326 }),
});
export type NewAcoesData = InferInsertModel<typeof acoes>;


export const fotosAcoes = pgTable("fotos_acoes", {
	id: serial().primaryKey().notNull(),
	acaoId: integer("acao_id").notNull().references(() => acoes.id, { onDelete: 'cascade' }),
	url: varchar({ length: 1000 }).notNull(),
	descricao: varchar({ length: 255 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

// Tipos para facilitar a inserção e seleção de dados
export type Regiao = InferSelectModel<typeof regioes>;
export type NewRegiao = InferInsertModel<typeof regioes>;

export type PontoMonitoramento = InferSelectModel<typeof pontosMonitoramento>;
export type NewPontoMonitoramento = InferInsertModel<typeof pontosMonitoramento>;

export type RegistroMonitoramento = InferSelectModel<typeof registrosMonitoramento>;
export type NewRegistroMonitoramento = InferInsertModel<typeof registrosMonitoramento>;

export type Acao = InferSelectModel<typeof acoes>;
export type Estrada = InferSelectModel<typeof estradas>;
export type Trilha = InferSelectModel<typeof trilhas>;
export type Waypoint = InferSelectModel<typeof waypoints>;
export type Desmatamento = InferSelectModel<typeof desmatamento>;
export type Propriedade = InferSelectModel<typeof propriedades>;
export type Firm = InferSelectModel<typeof rawFirms>;
export type FotoAcao = InferSelectModel<typeof fotosAcoes>;
