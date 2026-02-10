import { pgTable, pgSchema, foreignKey, serial, varchar, numeric, timestamp, geometry, integer, text, date, index, boolean, jsonb, unique, doublePrecision, uniqueIndex, time, uuid } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const monitoramento = pgSchema("monitoramento");
export const categoriaAcaoInMonitoramento = monitoramento.enum("categoria_acao", ['Fiscalização', 'Recuperação', 'Incidente', 'Monitoramento', 'Infraestrutura'])
export const statusAcoesInMonitoramento = monitoramento.enum("status_acoes", ['Identificado', 'Em Recuperação', 'Concluído'])


export const acoesInMonitoramento = monitoramento.table("acoes", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 255 }),
	latitude: numeric({ precision: 10, scale:  6 }),
	longitude: numeric({ precision: 10, scale:  6 }),
	elevation: numeric({ precision: 8, scale:  2 }),
	time: timestamp({ mode: 'string' }),
	descricao: varchar({ length: 255 }),
	mes: varchar({ length: 50 }),
	atuacao: varchar({ length: 100 }),
	acao: varchar({ length: 100 }),
	geom: geometry({ type: "pointz", srid: 4674 }),
	regiaoId: integer("regiao_id"),
	categoria: categoriaAcaoInMonitoramento(),
	tipo: text(),
	status: statusAcoesInMonitoramento(),
	eixoTematico: varchar("eixo_tematico", { length: 100 }),
	tipoTecnico: varchar("tipo_tecnico", { length: 100 }),
	carater: varchar({ length: 50 }),
}, (table) => [
	foreignKey({
			columns: [table.regiaoId],
			foreignColumns: [regioesInMonitoramento.id],
			name: "acoes_regiao_id_fkey"
		}).onUpdate("cascade"),
	foreignKey({
			columns: [table.regiaoId],
			foreignColumns: [regioesInMonitoramento.id],
			name: "acoes_regiao_id_regioes_id_fk"
		}),
]);

export const trilhasInMonitoramento = monitoramento.table("trilhas", {
	id: serial().primaryKey().notNull(),
	nome: text().notNull(),
	geom: geometry({ type: "multilinestringz", srid: 4674 }).notNull(),
	dataInicio: timestamp("data_inicio", { mode: 'string' }),
	dataFim: timestamp("data_fim", { mode: 'string' }),
	duracaoMinutos: integer("duracao_minutos"),
	regiaoId: integer("regiao_id"),
}, (table) => [
	foreignKey({
			columns: [table.regiaoId],
			foreignColumns: [regioesInMonitoramento.id],
			name: "trilhas_regiao_id_regioes_id_fk"
		}),
]);

export const dequeDePedrasInMonitoramento = monitoramento.table("deque_de_pedras", {
	id: serial().primaryKey().notNull(),
	local: varchar({ length: 255 }),
	mes: varchar({ length: 50 }),
	data: date(),
	turbidez: numeric({ precision: 5, scale:  2 }),
	secchiVertical: numeric("secchi_vertical", { precision: 5, scale:  2 }),
	secchiHorizontal: numeric("secchi_horizontal", { precision: 5, scale:  2 }),
	chuva: numeric({ precision: 5, scale:  2 }),
});

export const fotosAcoesInMonitoramento = monitoramento.table("fotos_acoes", {
	id: serial().primaryKey().notNull(),
	acaoId: integer("acao_id").notNull(),
	url: varchar({ length: 1000 }).notNull(),
	descricao: varchar({ length: 255 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	atualizacao: date(),
}, (table) => [
	foreignKey({
			columns: [table.acaoId],
			foreignColumns: [acoesInMonitoramento.id],
			name: "fotos_acoes_acao_id_acoes_id_fk"
		}),
]);

export const destinatariosAlertasInMonitoramento = monitoramento.table("destinatarios_alertas", {
	id: serial().primaryKey().notNull(),
	regiaoId: integer("regiao_id").notNull(),
	email: varchar({ length: 255 }).notNull(),
	nome: varchar({ length: 255 }),
	ativo: boolean().default(true).notNull(),
	preferencias: jsonb().default({"fogo":true,"nivel_rio":true,"relatorio_semanal":true}),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_destinatarios_regiao").using("btree", table.regiaoId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.regiaoId],
			foreignColumns: [regioesInMonitoramento.id],
			name: "destinatarios_alertas_regiao_id_fkey"
		}).onDelete("cascade"),
]);

export const ponteDoCureInMonitoramento = monitoramento.table("ponte_do_cure", {
	id: serial().primaryKey().notNull(),
	local: varchar({ length: 255 }),
	mes: varchar({ length: 50 }),
	data: date(),
	chuva: numeric({ precision: 5, scale:  2 }),
	nivel: numeric({ precision: 5, scale:  2 }),
	visibilidade: varchar({ length: 50 }),
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

export const waypointsInMonitoramento = monitoramento.table("waypoints", {
	id: serial().primaryKey().notNull(),
	trilhaId: integer("trilha_id").notNull(),
	nome: text(),
	geom: geometry({ type: "pointz", srid: 4674 }).notNull(),
	ele: doublePrecision(),
	recordedat: timestamp({ mode: 'string' }),
	regiaoId: integer("regiao_id"),
}, (table) => [
	foreignKey({
			columns: [table.regiaoId],
			foreignColumns: [regioesInMonitoramento.id],
			name: "waypoints_regiao_id_regioes_id_fk"
		}),
	foreignKey({
			columns: [table.trilhaId],
			foreignColumns: [trilhasInMonitoramento.id],
			name: "waypoints_trilha_id_trilhas_id_fk"
		}).onDelete("cascade"),
]);

export const layerCatalogInMonitoramento = monitoramento.table("layer_catalog", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	slug: text().notNull(),
	schemaConfig: jsonb("schema_config"),
	visualConfig: jsonb("visual_config"),
	regiaoId: integer("regiao_id"),
	ordering: integer().default(0),
}, (table) => [
	foreignKey({
			columns: [table.regiaoId],
			foreignColumns: [regioesInMonitoramento.id],
			name: "layer_catalog_regiao_id_fkey"
		}),
	unique("layer_catalog_slug_unique").on(table.slug),
]);

export const layerDataInMonitoramento = monitoramento.table("layer_data", {
	id: serial().primaryKey().notNull(),
	layerId: integer("layer_id"),
	geom: geometry({ type: "geometry", srid: 4674 }),
	properties: jsonb(),
	dataRegistro: timestamp("data_registro", { mode: 'string' }),
}, (table) => [
	index("idx_layer_data_data_registro").using("btree", table.dataRegistro.asc().nullsLast().op("timestamp_ops")),
	index("idx_layer_data_geom").using("gist", table.geom.asc().nullsLast().op("gist_geometry_ops_2d")),
	foreignKey({
			columns: [table.layerId],
			foreignColumns: [layerCatalogInMonitoramento.id],
			name: "layer_data_layer_id_layer_catalog_id_fk"
		}),
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
	regiaoId: integer("regiao_id"),
}, (table) => [
	foreignKey({
			columns: [table.regiaoId],
			foreignColumns: [regioesInMonitoramento.id],
			name: "desmatamento_regiao_id_regioes_id_fk"
		}),
]);

export const estradasInMonitoramento = monitoramento.table("estradas", {
	id: serial().primaryKey().notNull(),
	nome: varchar({ length: 255 }),
	tipo: varchar({ length: 100 }),
	codigo: varchar({ length: 50 }),
	geom: geometry({ type: "multilinestringz", srid: 4674 }),
	regiaoId: integer("regiao_id"),
}, (table) => [
	foreignKey({
			columns: [table.regiaoId],
			foreignColumns: [regioesInMonitoramento.id],
			name: "estradas_regiao_id_regioes_id_fk"
		}),
]);

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
	geom: geometry({ type: "multipolygon", srid: 4674 }),
	nome: text(),
	regiaoId: integer("regiao_id"),
	properties: jsonb(),
}, (table) => [
	foreignKey({
			columns: [table.regiaoId],
			foreignColumns: [regioesInMonitoramento.id],
			name: "propriedades_regiao_id_regioes_id_fk"
		}),
]);

export const rawFirmsInMonitoramento = monitoramento.table("raw_firms", {
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
	id: uuid().defaultRandom().primaryKey().notNull(),
	regiaoId: integer("regiao_id"),
}, (table) => [
	uniqueIndex("idx_firms_point_unique").using("btree", table.latitude.asc().nullsLast().op("date_ops"), table.longitude.asc().nullsLast().op("float8_ops"), table.acqDate.asc().nullsLast().op("date_ops"), table.acqTime.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.regiaoId],
			foreignColumns: [regioesInMonitoramento.id],
			name: "raw_firms_regiao_id_regioes_id_fk"
		}),
	unique("raw_firms_id_key").on(table.id),
]);
