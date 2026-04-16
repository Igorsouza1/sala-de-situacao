import { pgTable, pgSchema, index, foreignKey, serial, varchar, numeric, timestamp, geometry, integer, text, uuid, date, boolean, jsonb, unique, check, doublePrecision, uniqueIndex, time } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const monitoramento = pgSchema("monitoramento");
export const categoriaAcaoInMonitoramento = monitoramento.enum("categoria_acao", ['Fiscalização', 'Recuperação', 'Incidente', 'Monitoramento', 'Infraestrutura'])
export const statusAcaoInMonitoramento = monitoramento.enum("status_acao", ['Ativo', 'Monitorando', 'Resolvido', 'Crítico'])
export const statusAcoesInMonitoramento = monitoramento.enum("status_acoes", ['Identificado', 'Em Recuperação', 'Concluído'])

export const baciaRioDaPrataIdSeqInMonitoramento = monitoramento.sequence("Bacia_RioDaPrata_id_seq", {  startWith: "1", increment: "1", minValue: "1", maxValue: "2147483647", cache: "1", cycle: false })
export const rioDaPrataLeitoIdSeqInMonitoramento = monitoramento.sequence("Rio da Prata - Leito_id_seq", {  startWith: "1", increment: "1", minValue: "1", maxValue: "2147483647", cache: "1", cycle: false })

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
	tenantId: uuid("tenant_id").notNull(),
}, (table) => [
	index("idx_acoes_tenant_region").using("btree", table.tenantId.asc().nullsLast().op("int4_ops"), table.regiaoId.asc().nullsLast().op("int4_ops"), table.time.desc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.regiaoId],
			foreignColumns: [regioesInMonitoramento.id],
			name: "acoes_regiao_id_regioes_id_fk"
		}),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenantsInMonitoramento.id],
			name: "acoes_tenant_id_fkey"
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
	tenantId: uuid("tenant_id").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.regiaoId],
			foreignColumns: [regioesInMonitoramento.id],
			name: "trilhas_regiao_id_regioes_id_fk"
		}),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenantsInMonitoramento.id],
			name: "trilhas_tenant_id_fkey"
		}),
]);

export const userAccessInMonitoramento = monitoramento.table("user_access", {
	id: serial().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	organizationId: uuid("organization_id").notNull(),
	regiaoId: integer("regiao_id"),
	role: varchar({ length: 50 }).default('viewer').notNull(),
}, (table) => [
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [tenantsInMonitoramento.id],
			name: "user_access_organization_id_fkey"
		}),
	foreignKey({
			columns: [table.regiaoId],
			foreignColumns: [regioesInMonitoramento.id],
			name: "user_access_regiao_id_fkey"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_access_user_id_fkey"
		}),
]);

export const javaliAvistamentosInMonitoramento = monitoramento.table("javali_avistamentos", {
	id: serial().primaryKey().notNull(),
	tipo: varchar({ length: 100 }).notNull(),
	observacoes: text(),
	geom: geometry({ type: "point", srid: 4674 }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	tenantId: uuid("tenant_id").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenantsInMonitoramento.id],
			name: "javali_avistamentos_tenant_id_fkey"
		}),
]);

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
});

export const tenantsInMonitoramento = monitoramento.table("tenants", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	maxRegions: integer("max_regions").default(1),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	slug: text().notNull(),
	plan: text().default('free').notNull(),
	maxUsers: integer("max_users").default(5).notNull(),
	storageQuotaGb: integer("storage_quota_gb").default(10).notNull(),
	active: boolean().default(true).notNull(),
	metadata: jsonb(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	unique("tenants_slug_unique").on(table.slug),
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
	tenantId: uuid("tenant_id").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenantsInMonitoramento.id],
			name: "deque_de_pedras_tenant_id_fkey"
		}),
]);

export const ponteDoCureInMonitoramento = monitoramento.table("ponte_do_cure", {
	id: serial().primaryKey().notNull(),
	local: varchar({ length: 255 }),
	mes: varchar({ length: 50 }),
	data: date(),
	chuva: numeric({ precision: 5, scale:  2 }),
	nivel: numeric({ precision: 5, scale:  2 }),
	visibilidade: varchar({ length: 50 }),
	tenantId: uuid("tenant_id").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenantsInMonitoramento.id],
			name: "ponte_do_cure_tenant_id_fkey"
		}),
]);

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
	organizationId: uuid("organization_id"),
}, (table) => [
	index("idx_regioes_geom").using("gist", table.geom.asc().nullsLast().op("gist_geometry_ops_2d")),
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [tenantsInMonitoramento.id],
			name: "regioes_organization_id_fkey"
		}),
	unique("regioes_slug_unique").on(table.slug),
]);

export const rolesInMonitoramento = monitoramento.table("roles", {
	id: serial().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	userId: uuid("user_id").notNull(),
	role: varchar({ length: 20 }).default('viewer').notNull(),
	regionId: integer("region_id"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_roles_tenant_user").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops"), table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.regionId],
			foreignColumns: [regioesInMonitoramento.id],
			name: "roles_region_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenantsInMonitoramento.id],
			name: "roles_tenant_id_fkey"
		}).onDelete("cascade"),
	unique("roles_tenant_id_user_id_region_id_key").on(table.tenantId, table.userId, table.regionId),
	check("roles_role_check", sql`(role)::text = ANY ((ARRAY['owner'::character varying, 'admin'::character varying, 'editor'::character varying, 'viewer'::character varying, 'auditor'::character varying])::text[])`),
]);

export const layerFeaturesInMonitoramento = monitoramento.table("layer_features", {
	id: serial().primaryKey().notNull(),
	layerId: integer("layer_id").notNull(),
	geom: geometry({ type: "geometry", srid: 4674 }).notNull(),
	properties: jsonb(),
}, (table) => [
	index("idx_layer_features_geom").using("gist", table.geom.asc().nullsLast().op("gist_geometry_ops_2d")),
	foreignKey({
			columns: [table.layerId],
			foreignColumns: [layerCatalogInMonitoramento.id],
			name: "layer_features_layer_id_fkey"
		}).onDelete("cascade"),
]);

export const featureObservationsInMonitoramento = monitoramento.table("feature_observations", {
	id: serial().primaryKey().notNull(),
	featureId: integer("feature_id").notNull(),
	properties: jsonb().notNull(),
	timestamp: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_observations_time").using("btree", table.timestamp.asc().nullsLast().op("timestamptz_ops")),
	foreignKey({
			columns: [table.featureId],
			foreignColumns: [layerFeaturesInMonitoramento.id],
			name: "feature_observations_feature_id_fkey"
		}).onDelete("cascade"),
]);

export const waypointsInMonitoramento = monitoramento.table("waypoints", {
	id: serial().primaryKey().notNull(),
	trilhaId: integer("trilha_id").notNull(),
	nome: text(),
	geom: geometry({ type: "pointz", srid: 4674 }).notNull(),
	ele: doublePrecision(),
	recordedat: timestamp({ mode: 'string' }),
	regiaoId: integer("regiao_id"),
	tenantId: uuid("tenant_id").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.regiaoId],
			foreignColumns: [regioesInMonitoramento.id],
			name: "waypoints_regiao_id_regioes_id_fk"
		}),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenantsInMonitoramento.id],
			name: "waypoints_tenant_id_fkey"
		}),
	foreignKey({
			columns: [table.trilhaId],
			foreignColumns: [trilhasInMonitoramento.id],
			name: "waypoints_trilha_id_trilhas_id_fk"
		}).onDelete("cascade"),
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
	tenantId: uuid("tenant_id").notNull(),
}, (table) => [
	index("idx_desmatamento_geom").using("gist", table.geom.asc().nullsLast().op("gist_geometry_ops_2d")),
	index("idx_desmatamento_tenant_region").using("btree", table.tenantId.asc().nullsLast().op("int4_ops"), table.regiaoId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.regiaoId],
			foreignColumns: [regioesInMonitoramento.id],
			name: "desmatamento_regiao_id_regioes_id_fk"
		}),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenantsInMonitoramento.id],
			name: "desmatamento_tenant_id_fkey"
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
	tenantId: uuid("tenant_id").notNull(),
}, (table) => [
	index("idx_propriedades_geom").using("gist", table.geom.asc().nullsLast().op("gist_geometry_ops_2d")),
	foreignKey({
			columns: [table.regiaoId],
			foreignColumns: [regioesInMonitoramento.id],
			name: "propriedades_regiao_id_regioes_id_fk"
		}),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenantsInMonitoramento.id],
			name: "propriedades_tenant_id_fkey"
		}),
]);

export const estradasInMonitoramento = monitoramento.table("estradas", {
	id: serial().primaryKey().notNull(),
	nome: varchar({ length: 255 }),
	tipo: varchar({ length: 100 }),
	codigo: varchar({ length: 50 }),
	geom: geometry({ type: "multilinestringz", srid: 4674 }),
	regiaoId: integer("regiao_id"),
	tenantId: uuid("tenant_id").notNull(),
}, (table) => [
	index("idx_estradas_geom").using("gist", table.geom.asc().nullsLast().op("gist_geometry_ops_2d")),
	foreignKey({
			columns: [table.regiaoId],
			foreignColumns: [regioesInMonitoramento.id],
			name: "estradas_regiao_id_regioes_id_fk"
		}),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenantsInMonitoramento.id],
			name: "estradas_tenant_id_fkey"
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
	alertaEnviado: boolean("alerta_enviado").default(false),
	codImovel: text("cod_imovel"),
	tenantId: uuid("tenant_id").notNull(),
}, (table) => [
	uniqueIndex("idx_firms_point_unique").using("btree", table.latitude.asc().nullsLast().op("date_ops"), table.longitude.asc().nullsLast().op("float8_ops"), table.acqDate.asc().nullsLast().op("date_ops"), table.acqTime.asc().nullsLast().op("date_ops")),
	index("idx_firms_tenant_region").using("btree", table.tenantId.asc().nullsLast().op("int4_ops"), table.regiaoId.asc().nullsLast().op("int4_ops"), table.acqDate.desc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.regiaoId],
			foreignColumns: [regioesInMonitoramento.id],
			name: "raw_firms_regiao_id_regioes_id_fk"
		}),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenantsInMonitoramento.id],
			name: "raw_firms_tenant_id_fkey"
		}),
	unique("raw_firms_id_key").on(table.id),
]);

export const layerCatalogInMonitoramento = monitoramento.table("layer_catalog", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	slug: text().notNull(),
	schemaConfig: jsonb("schema_config"),
	visualConfig: jsonb("visual_config"),
	regiaoId: integer("regiao_id"),
	ordering: integer().default(0),
	tenantId: uuid("tenant_id").notNull(),
}, (table) => [
	index("idx_layer_catalog_tenant").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.regiaoId],
			foreignColumns: [regioesInMonitoramento.id],
			name: "layer_catalog_regiao_id_fkey"
		}),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenantsInMonitoramento.id],
			name: "layer_catalog_tenant_id_fkey"
		}),
	unique("layer_catalog_slug_unique").on(table.slug),
]);

export const layerDataInMonitoramento = monitoramento.table("layer_data", {
	id: serial().primaryKey().notNull(),
	layerId: integer("layer_id"),
	geom: geometry({ type: "geometry", srid: 4674 }),
	properties: jsonb(),
	dataRegistro: timestamp("data_registro", { mode: 'string' }),
	tenantId: uuid("tenant_id").notNull(),
}, (table) => [
	index("idx_layer_data_data_registro").using("btree", table.dataRegistro.asc().nullsLast().op("timestamp_ops")),
	index("idx_layer_data_geom").using("gist", table.geom.asc().nullsLast().op("gist_geometry_ops_2d")),
	index("idx_layer_data_tenant").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.layerId],
			foreignColumns: [layerCatalogInMonitoramento.id],
			name: "layer_data_layer_id_layer_catalog_id_fk"
		}),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenantsInMonitoramento.id],
			name: "layer_data_tenant_id_fkey"
		}),
]);

export const balnearioMunicipalInMonitoramento = monitoramento.table("balneario_municipal", {
	id: serial().primaryKey().notNull(),
	local: varchar({ length: 255 }),
	mes: varchar({ length: 50 }),
	data: date(),
	turbidez: numeric({ precision: 5, scale:  2 }),
	secchiVertical: numeric("secchi_vertical", { precision: 5, scale:  2 }),
	nivelAgua: numeric("nivel_agua", { precision: 7, scale:  2 }),
	pluviometria: numeric({ precision: 5, scale:  2 }),
	observacao: text(),
	tenantId: uuid("tenant_id").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenantsInMonitoramento.id],
			name: "balneario_municipal_tenant_id_fkey"
		}),
]);
