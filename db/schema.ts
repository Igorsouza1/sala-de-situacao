import { pgSchema, serial, geometry, bigint, doublePrecision, integer, varchar, numeric, text, timestamp, date, foreignKey, unique, time, uuid, index, jsonb, uniqueIndex, boolean, pgTable } from "drizzle-orm/pg-core"
import { InferInsertModel } from "drizzle-orm"

export const monitoramento = pgSchema("monitoramento");

export const categoriaAcaoInMonitoramento = monitoramento.enum("categoria_acao", ['Fiscalização', 'Recuperação', 'Incidente', 'Monitoramento', 'Infraestrutura'])
export const statusAcaoInMonitoramento = monitoramento.enum("status_acao", ['Ativo', 'Monitorando', 'Resolvido', 'Crítico'])
export const statusAcoesInMonitoramento = monitoramento.enum("status_acoes", ['Identificado', 'Em Recuperação', 'Concluído'])

export const organizationsInMonitoramento = monitoramento.table("organizations", {
	id: uuid("id").primaryKey().defaultRandom(),
	name: varchar("name", { length: 255 }).notNull(),
	maxRegions: integer("max_regions").default(1),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

export const regioesInMonitoramento = monitoramento.table("regioes", {
	id: serial().primaryKey().notNull(),
	nome: varchar({ length: 255 }).notNull(),
	descricao: text(),
	geom: geometry({ type: "multipolygon", srid: 4674 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	cor: text(),
	slug: text(),
	metadata: jsonb(),
}, (table) => [
	index("idx_regioes_geom").using("gist", table.geom.asc().nullsLast().op("gist_geometry_ops_2d")),
	unique("regioes_slug_unique").on(table.slug),
]);

export const userAccessInMonitoramento = monitoramento.table("user_access", {
	id: serial("id").primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	organizationId: uuid("organization_id").references(() => organizationsInMonitoramento.id).notNull(),
	regiaoId: integer("regiao_id").references(() => regioesInMonitoramento.id),
	role: varchar("role", { length: 50 }).default('viewer').notNull(),
});

export const acoesInMonitoramento = monitoramento.table("acoes", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 255 }),
	latitude: numeric({ precision: 10, scale: 6 }),
	longitude: numeric({ precision: 10, scale: 6 }),
	elevation: numeric({ precision: 8, scale: 2 }),
	time: timestamp({ mode: 'string' }),
	descricao: varchar({ length: 255 }),
	mes: varchar({ length: 50 }),
	atuacao: varchar({ length: 100 }),
	acao: varchar({ length: 100 }),
	geom: geometry({ type: "pointz", srid: 4674 }),
	regiaoId: integer("regiao_id").references(() => regioesInMonitoramento.id),
	categoria: categoriaAcaoInMonitoramento(),
	tipo: text(),
	status: statusAcoesInMonitoramento(),
	eixoTematico: varchar("eixo_tematico", { length: 100 }),
	tipoTecnico: varchar("tipo_tecnico", { length: 100 }),
	carater: varchar("carater", { length: 50 }),
});

export const trilhasInMonitoramento = monitoramento.table("trilhas", {
	id: serial().primaryKey().notNull(),
	nome: text().notNull(),
	geom: geometry({ type: "multilinestringz", srid: 4674 }).notNull(),
	regiaoId: integer("regiao_id").references(() => regioesInMonitoramento.id),
	dataInicio: timestamp("data_inicio", { mode: 'string' }),
	dataFim: timestamp("data_fim", { mode: 'string' }),
	duracaoMinutos: integer("duracao_minutos"),
});

export const dequeDePedrasInMonitoramento = monitoramento.table("deque_de_pedras", {
	id: serial().primaryKey().notNull(),
	local: varchar({ length: 255 }),
	mes: varchar({ length: 50 }),
	data: date(),
	turbidez: numeric({ precision: 5, scale: 2 }),
	secchiVertical: numeric("secchi_vertical", { precision: 5, scale: 2 }),
	secchiHorizontal: numeric("secchi_horizontal", { precision: 5, scale: 2 }),
	chuva: numeric({ precision: 5, scale: 2 }),
});

export const fotosAcoesInMonitoramento = monitoramento.table("fotos_acoes", {
	id: serial().primaryKey().notNull(),
	acaoId: integer("acao_id").references(() => acoesInMonitoramento.id).notNull(),
	url: varchar({ length: 1000 }).notNull(),
	descricao: varchar({ length: 255 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	atualizacao: date(),
});

export const destinatariosAlertasInMonitoramento = monitoramento.table("destinatarios_alertas", {
	id: serial().primaryKey().notNull(),
	regiaoId: integer("regiao_id").references(() => regioesInMonitoramento.id).notNull(),
	email: varchar({ length: 255 }).notNull(),
	nome: varchar({ length: 255 }),
	ativo: boolean().default(true).notNull(),
	preferencias: jsonb().default({ "fogo": true, "nivel_rio": true, "relatorio_semanal": true }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

export const ponteDoCureInMonitoramento = monitoramento.table("ponte_do_cure", {
	id: serial().primaryKey().notNull(),
	local: varchar({ length: 255 }),
	mes: varchar({ length: 50 }),
	data: date(),
	chuva: numeric({ precision: 5, scale: 2 }),
	nivel: numeric({ precision: 5, scale: 2 }),
	visibilidade: varchar({ length: 50 }),
});

export const waypointsInMonitoramento = monitoramento.table("waypoints", {
	id: serial().primaryKey().notNull(),
	trilhaId: integer("trilha_id").notNull(),
	nome: text(),
	geom: geometry({ type: "pointz", srid: 4674 }).notNull(),
	regiaoId: integer("regiao_id").references(() => regioesInMonitoramento.id),
	ele: doublePrecision(),
	recordedat: timestamp({ mode: 'string' }),
}, (table) => [
	foreignKey({
		columns: [table.trilhaId],
		foreignColumns: [trilhasInMonitoramento.id],
		name: "waypoints_trilha_id_trilhas_id_fk"
	}).onDelete("cascade"),
]);

export const layerCatalogInMonitoramento = monitoramento.table("layer_catalog", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	slug: text().notNull().unique(),
	schemaConfig: jsonb("schema_config"),
	visualConfig: jsonb("visual_config"),
	regiaoId: integer("regiao_id").references(() => regioesInMonitoramento.id),
	ordering: integer().default(0),
});

export const layerDataInMonitoramento = monitoramento.table("layer_data", {
	id: serial().primaryKey().notNull(),
	layerId: integer("layer_id").references(() => layerCatalogInMonitoramento.id),
	geom: geometry({ type: "geometry", srid: 4674 }),
	properties: jsonb(),
	dataRegistro: timestamp("data_registro", { mode: 'string' }),
}, (table) => [
	index("idx_layer_data_data_registro").using("btree", table.dataRegistro.asc().nullsLast().op("timestamp_ops")),
	index("idx_layer_data_geom").using("gist", table.geom.asc().nullsLast().op("gist_geometry_ops_2d")),
]);

export const rawFirmsInMonitoramento = monitoramento.table("raw_firms", {
	id: uuid().defaultRandom().primaryKey().notNull(),
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
	regiaoId: integer("regiao_id").references(() => regioesInMonitoramento.id),
	alertaEnviado: boolean("alerta_enviado").default(false),
	codImovel: text("cod_imovel"),
}, (table) => [
	uniqueIndex("idx_firms_point_unique").using("btree", table.latitude.asc().nullsLast().op("date_ops"), table.longitude.asc().nullsLast().op("float8_ops"), table.acqDate.asc().nullsLast().op("date_ops"), table.acqTime.asc().nullsLast().op("text_ops")),
]);

export const desmatamentoInMonitoramento = monitoramento.table("desmatamento", {
	id: serial().primaryKey().notNull(),
	alertid: text(),
	alertcode: text(),
	alertha: doublePrecision(),
	source: text(),
	detectat: text(),
	detectyear: integer(),
	state: text(),
	stateha: doublePrecision(),
	geom: geometry({ type: "geometry", srid: 4674 }),
	regiaoId: integer("regiao_id").references(() => regioesInMonitoramento.id),
});

export const estradasInMonitoramento = monitoramento.table("estradas", {
	id: serial().primaryKey().notNull(),
	nome: varchar({ length: 255 }),
	tipo: varchar({ length: 100 }),
	codigo: varchar({ length: 50 }),
	geom: geometry({ type: "multilinestringz", srid: 4674 }),
	regiaoId: integer("regiao_id").references(() => regioesInMonitoramento.id),
});

export const propriedadesInMonitoramento = monitoramento.table("propriedades", {
	id: serial().primaryKey().notNull(),
	codTema: varchar("cod_tema", { length: 50 }),
	nomTema: varchar("nom_tema", { length: 100 }),
	codImovel: varchar("cod_imovel", { length: 100 }),
	modFiscal: doublePrecision("mod_fiscal"),
	numArea: doublePrecision("num_area"),
	indStatus: varchar("ind_status", { length: 20 }),
	indTipo: varchar("ind_tipo", { length: 20 }),
	desCondic: text("des_condic"),
	municipio: varchar({ length: 100 }),
	nome: text(),
	geom: geometry({ type: "multipolygon", srid: 4674 }),
	regiaoId: integer("regiao_id").references(() => regioesInMonitoramento.id),
	properties: jsonb(),
});


// TYPES

type BaseAcoesData = InferInsertModel<typeof acoesInMonitoramento>;

export type NewAcoesData = Omit<BaseAcoesData, 'geom'> & {
	geom: string;
};


type BaseWaypointData = InferInsertModel<typeof waypointsInMonitoramento>;

export type NewWaypointData = Omit<BaseWaypointData, 'geom'> & {
	geom: string;
};


type BaseEstradaData = InferInsertModel<typeof estradasInMonitoramento>;

export type NewEstradaData = Omit<BaseEstradaData, 'geom'> & {
	geom: string;
};


type BaseTrilhaData = InferInsertModel<typeof trilhasInMonitoramento>;

export type NewTrilhaData = Omit<BaseTrilhaData, 'geom'> & {
	geom: string;
};