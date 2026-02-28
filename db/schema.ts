import { pgSchema, serial, geometry, bigint, doublePrecision, integer, varchar, numeric, text, timestamp, date, foreignKey, unique, time, uuid, index, jsonb, uniqueIndex, boolean } from "drizzle-orm/pg-core"
import { InferInsertModel } from "drizzle-orm"

export const monitoramento = pgSchema("monitoramento");

// Backwards compatibility alias
export const rioDaPrata = monitoramento;

export const categoriaAcaoInMonitoramento = monitoramento.enum("categoria_acao", ['Fiscalização', 'Recuperação', 'Incidente', 'Monitoramento', 'Infraestrutura'])
export const statusAcaoInMonitoramento = monitoramento.enum("status_acao", ['Ativo', 'Monitorando', 'Resolvido', 'Crítico'])

// Aliases for enums
export const categoriaAcaoInRioDaPrata = categoriaAcaoInMonitoramento;
export const statusAcaoInRioDaPrata = statusAcaoInMonitoramento;

export const baciaRioDaPrataIdSeqInMonitoramento = monitoramento.sequence("Bacia_RioDaPrata_id_seq", { startWith: "1", increment: "1", minValue: "1", maxValue: "2147483647", cache: "1", cycle: false })
export const rioDaPrataLeitoIdSeqInMonitoramento = monitoramento.sequence("Rio da Prata - Leito_id_seq", { startWith: "1", increment: "1", minValue: "1", maxValue: "2147483647", cache: "1", cycle: false })

export const baciaRioDaPrataIdSeqInRioDaPrata = baciaRioDaPrataIdSeqInMonitoramento;
export const rioDaPrataLeitoIdSeqInRioDaPrata = rioDaPrataLeitoIdSeqInMonitoramento;


// --- CORE TABLES (Type A) ---

export const regioesInMonitoramento = monitoramento.table("regioes", {
	id: serial().primaryKey().notNull(),
	nome: varchar({ length: 255 }).notNull(),
	slug: text("slug").unique(), // Added
	metadata: jsonb("metadata"), // Added
	descricao: text(),
	geom: geometry({ type: "multipolygon", srid: 4674 }), // Updated SRID
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	cor: text(),
}, (table) => [
	index("idx_regioes_geom").using("gist", table.geom.asc().nullsLast().op("gist_geometry_ops_2d")),
]);
export const regioesInRioDaPrata = regioesInMonitoramento;


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
	geom: geometry({ type: "pointz", srid: 4674 }), // Updated SRID
	regiaoId: integer("regiao_id").references(() => regioesInMonitoramento.id), // Added FK
	categoria: categoriaAcaoInMonitoramento(),
	tipo: text(),
	status: statusAcaoInMonitoramento(),
	eixoTematico: varchar("eixo_tematico", { length: 100 }),
	tipoTecnico: varchar("tipo_tecnico", { length: 100 }),
	carater: varchar("carater", { length: 50 }),
}, (table) => [
	// Foreign key to regioes is handled by .references() above, but we can explicitly define it if needed for naming overlap control
	// Keeping existing separate FK definition style for consistency if preferred, otherwise inline is standard.
	// The previous schema had:
	/*
	foreignKey({
		columns: [table.regiaoId],
		foreignColumns: [regioesInRioDaPrata.id],
		name: "acoes_regiao_id_fkey"
	}).onUpdate("cascade"),
	*/
]);
export const acoesInRioDaPrata = acoesInMonitoramento;


export const trilhasInMonitoramento = monitoramento.table("trilhas", {
	id: serial().primaryKey().notNull(),
	nome: text().notNull(),
	geom: geometry({ type: "multilinestringz", srid: 4674 }).notNull(), // Updated SRID
	regiaoId: integer("regiao_id").references(() => regioesInMonitoramento.id), // Added FK
	dataInicio: timestamp("data_inicio", { mode: 'string' }),
	dataFim: timestamp("data_fim", { mode: 'string' }),
	duracaoMinutos: integer("duracao_minutos"),
});
export const trilhasInRioDaPrata = trilhasInMonitoramento;


export const waypointsInMonitoramento = monitoramento.table("waypoints", {
	id: serial().primaryKey().notNull(),
	trilhaId: integer("trilha_id").notNull(),
	nome: text(),
	geom: geometry({ type: "pointz", srid: 4674 }).notNull(), // Updated SRID
	regiaoId: integer("regiao_id").references(() => regioesInMonitoramento.id), // Added FK
	ele: doublePrecision(),
	recordedat: timestamp({ mode: 'string' }),
}, (table) => [
	foreignKey({
		columns: [table.trilhaId],
		foreignColumns: [trilhasInMonitoramento.id],
		name: "waypoints_trilha_id_trilhas_id_fk"
	}).onDelete("cascade"),
]);
export const waypointsInRioDaPrata = waypointsInMonitoramento;


export const estradasInMonitoramento = monitoramento.table("estradas", {
	id: serial().primaryKey().notNull(),
	nome: varchar({ length: 255 }),
	tipo: varchar({ length: 100 }),
	codigo: varchar({ length: 50 }),
	geom: geometry({ type: "multilinestringz", srid: 4674 }), // Updated SRID
	regiaoId: integer("regiao_id").references(() => regioesInMonitoramento.id), // Added FK
});
export const estradasInRioDaPrata = estradasInMonitoramento;


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
	geom: geometry({ type: "geometry", srid: 4674 }), // Updated SRID
	regiaoId: integer("regiao_id").references(() => regioesInMonitoramento.id), // Added FK
});
export const desmatamentoInRioDaPrata = desmatamentoInMonitoramento;


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
	geom: geometry({ type: "multipolygon", srid: 4674 }), // Updated SRID
	nome: text(),
	regiaoId: integer("regiao_id").references(() => regioesInMonitoramento.id), // Added FK
	properties: jsonb("properties"), // Added JSONB
});
export const propriedadesInRioDaPrata = propriedadesInMonitoramento;


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
	alerta_enviado: boolean("alerta_enviado").default(false).notNull(),
	codImovel: varchar("cod_imovel", { length: 100 }), // CAR Code from enrichment
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
export const rawFirmsInRioDaPrata = rawFirmsInMonitoramento;


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


export const leitoRioDaPrataInMonitoramento = monitoramento.table("Leito_Rio_Da_Prata", {
	id: serial().primaryKey().notNull(),
	geom: geometry({ type: "multilinestringz", srid: 4674 }), // Updated SRID
	name: varchar({ length: 254 }),
	descriptio: varchar({ length: 254 }),
	timestamp: varchar({ length: 24 }),
	begin: varchar({ length: 24 }),
	end: varchar({ length: 24 }),
	altitudemo: varchar({ length: 254 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	tessellate: bigint({ mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	extrude: bigint({ mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	visibility: bigint({ mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	draworder: bigint({ mode: "number" }),
	icon: varchar({ length: 254 }),
	descript1: varchar("descript_1", { length: 254 }),
	altitude1: varchar("altitude_1", { length: 254 }),
	gmLayer: varchar("gm_layer", { length: 254 }),
	gmType: varchar("gm_type", { length: 254 }),
	layer: varchar({ length: 254 }),
	compriment: numeric(),
	metros: doublePrecision(),
});
export const leitoRioDaPrataInRioDaPrata = leitoRioDaPrataInMonitoramento;


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
export const dequeDePedrasInRioDaPrata = dequeDePedrasInMonitoramento;


export const ponteDoCureInMonitoramento = monitoramento.table("ponte_do_cure", {
	id: serial().primaryKey().notNull(),
	local: varchar({ length: 255 }),
	mes: varchar({ length: 50 }),
	data: date(),
	chuva: numeric({ precision: 5, scale: 2 }),
	nivel: numeric({ precision: 5, scale: 2 }),
	visibilidade: varchar({ length: 50 }),
});
export const ponteDoCureInRioDaPrata = ponteDoCureInMonitoramento;


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