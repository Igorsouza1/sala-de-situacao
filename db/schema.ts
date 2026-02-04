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
export const fotosAcoesInRioDaPrata = fotosAcoesInMonitoramento;


export const destinatariosAlertasInMonitoramento = monitoramento.table("destinatarios_alertas", {
	id: serial().primaryKey().notNull(),
	regiaoId: integer("regiao_id").notNull(),
	email: varchar({ length: 255 }).notNull(),
	preferencias: jsonb().default({ "fogo": true }),
	ativo: boolean().default(true),
}, (table) => [
	foreignKey({
		columns: [table.regiaoId],
		foreignColumns: [regioesInMonitoramento.id],
		name: "destinatarios_alertas_regiao_id_regioes_id_fk"
	}),
]);
export const destinatariosAlertasInRioDaPrata = destinatariosAlertasInMonitoramento;


// --- NEW DYNAMIC MONITORING TABLES (Type B) ---

export const layerCatalogInMonitoramento = monitoramento.table("layer_catalog", {
	id: serial("id").primaryKey(),
	name: text("name").notNull(),
	slug: text("slug").notNull().unique(),
	schemaConfig: jsonb("schema_config"),
	visualConfig: jsonb("visual_config"),
	ordering: integer("ordering").notNull(),
});

export const layerDataInMonitoramento = monitoramento.table("layer_data", {
	id: serial("id").primaryKey(),
	layerId: integer("layer_id").references(() => layerCatalogInMonitoramento.id),
	geom: geometry("geom", { type: "geometry", srid: 4674 }),
	properties: jsonb("properties"),
	dataRegistro: timestamp("data_registro"),
}, (table) => [
	index("idx_layer_data_geom").using("gist", table.geom),
	index("idx_layer_data_data_registro").on(table.dataRegistro),
]);


// --- DEPRECATED/LEGACY TABLES ---
// Maintained for backward compatibility but marked for migration.

export const baciaRioDaPrataInMonitoramento = monitoramento.table("Bacia_Rio_Da_Prata", {
	id: serial().primaryKey().notNull(),
	geom: geometry({ type: "multipolygon", srid: 4674 }), // Updated SRID to match system standard
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	hybasId: bigint("hybas_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	nextDown: bigint("next_down", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	nextSink: bigint("next_sink", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	mainBas: bigint("main_bas", { mode: "number" }),
	distSink: doublePrecision("dist_sink"),
	distMain: doublePrecision("dist_main"),
	subArea: doublePrecision("sub_area"),
	upArea: doublePrecision("up_area"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	pfafId: bigint("pfaf_id", { mode: "number" }),
	endo: integer(),
	coast: integer(),
	order: integer("order_"),
	sort: integer(),
	disM3Pyr: doublePrecision("dis_m3_pyr"),
	disM3Pmn: doublePrecision("dis_m3_pmn"),
	disM3Pmx: doublePrecision("dis_m3_pmx"),
	runMmSyr: integer("run_mm_syr"),
	inuPcSmn: integer("inu_pc_smn"),
	inuPcUmn: integer("inu_pc_umn"),
	inuPcSmx: integer("inu_pc_smx"),
	inuPcUmx: integer("inu_pc_umx"),
	inuPcSlt: integer("inu_pc_slt"),
	inuPcUlt: integer("inu_pc_ult"),
	lkaPcSse: integer("lka_pc_sse"),
	lkaPcUse: integer("lka_pc_use"),
	lkvMcUsu: integer("lkv_mc_usu"),
	revMcUsu: integer("rev_mc_usu"),
	dorPcPva: integer("dor_pc_pva"),
	riaHaSsu: doublePrecision("ria_ha_ssu"),
	riaHaUsu: doublePrecision("ria_ha_usu"),
	rivTcSsu: doublePrecision("riv_tc_ssu"),
	rivTcUsu: doublePrecision("riv_tc_usu"),
	gwtCmSav: integer("gwt_cm_sav"),
	eleMtSav: integer("ele_mt_sav"),
	eleMtUav: integer("ele_mt_uav"),
	eleMtSmn: integer("ele_mt_smn"),
	eleMtSmx: integer("ele_mt_smx"),
	slpDgSav: integer("slp_dg_sav"),
	slpDgUav: integer("slp_dg_uav"),
	sgrDkSav: integer("sgr_dk_sav"),
	clzClSmj: integer("clz_cl_smj"),
	clsClSmj: integer("cls_cl_smj"),
	tmpDcSyr: integer("tmp_dc_syr"),
	tmpDcUyr: integer("tmp_dc_uyr"),
	tmpDcSmn: integer("tmp_dc_smn"),
	tmpDcSmx: integer("tmp_dc_smx"),
	tmpDcS01: integer("tmp_dc_s01"),
	tmpDcS02: integer("tmp_dc_s02"),
	tmpDcS03: integer("tmp_dc_s03"),
	tmpDcS04: integer("tmp_dc_s04"),
	tmpDcS05: integer("tmp_dc_s05"),
	tmpDcS06: integer("tmp_dc_s06"),
	tmpDcS07: integer("tmp_dc_s07"),
	tmpDcS08: integer("tmp_dc_s08"),
	tmpDcS09: integer("tmp_dc_s09"),
	tmpDcS10: integer("tmp_dc_s10"),
	tmpDcS11: integer("tmp_dc_s11"),
	tmpDcS12: integer("tmp_dc_s12"),
	preMmSyr: integer("pre_mm_syr"),
	preMmUyr: integer("pre_mm_uyr"),
	preMmS01: integer("pre_mm_s01"),
	preMmS02: integer("pre_mm_s02"),
	preMmS03: integer("pre_mm_s03"),
	preMmS04: integer("pre_mm_s04"),
	preMmS05: integer("pre_mm_s05"),
	preMmS06: integer("pre_mm_s06"),
	preMmS07: integer("pre_mm_s07"),
	preMmS08: integer("pre_mm_s08"),
	preMmS09: integer("pre_mm_s09"),
	preMmS10: integer("pre_mm_s10"),
	preMmS11: integer("pre_mm_s11"),
	preMmS12: integer("pre_mm_s12"),
	petMmSyr: integer("pet_mm_syr"),
	petMmUyr: integer("pet_mm_uyr"),
	petMmS01: integer("pet_mm_s01"),
	petMmS02: integer("pet_mm_s02"),
	petMmS03: integer("pet_mm_s03"),
	petMmS04: integer("pet_mm_s04"),
	petMmS05: integer("pet_mm_s05"),
	petMmS06: integer("pet_mm_s06"),
	petMmS07: integer("pet_mm_s07"),
	petMmS08: integer("pet_mm_s08"),
	petMmS09: integer("pet_mm_s09"),
	petMmS10: integer("pet_mm_s10"),
	petMmS11: integer("pet_mm_s11"),
	petMmS12: integer("pet_mm_s12"),
	aetMmSyr: integer("aet_mm_syr"),
	aetMmUyr: integer("aet_mm_uyr"),
	aetMmS01: integer("aet_mm_s01"),
	aetMmS02: integer("aet_mm_s02"),
	aetMmS03: integer("aet_mm_s03"),
	aetMmS04: integer("aet_mm_s04"),
	aetMmS05: integer("aet_mm_s05"),
	aetMmS06: integer("aet_mm_s06"),
	aetMmS07: integer("aet_mm_s07"),
	aetMmS08: integer("aet_mm_s08"),
	aetMmS09: integer("aet_mm_s09"),
	aetMmS10: integer("aet_mm_s10"),
	aetMmS11: integer("aet_mm_s11"),
	aetMmS12: integer("aet_mm_s12"),
	ariIxSav: integer("ari_ix_sav"),
	ariIxUav: integer("ari_ix_uav"),
	cmiIxSyr: integer("cmi_ix_syr"),
	cmiIxUyr: integer("cmi_ix_uyr"),
	cmiIxS01: integer("cmi_ix_s01"),
	cmiIxS02: integer("cmi_ix_s02"),
	cmiIxS03: integer("cmi_ix_s03"),
	cmiIxS04: integer("cmi_ix_s04"),
	cmiIxS05: integer("cmi_ix_s05"),
	cmiIxS06: integer("cmi_ix_s06"),
	cmiIxS07: integer("cmi_ix_s07"),
	cmiIxS08: integer("cmi_ix_s08"),
	cmiIxS09: integer("cmi_ix_s09"),
	cmiIxS10: integer("cmi_ix_s10"),
	cmiIxS11: integer("cmi_ix_s11"),
	cmiIxS12: integer("cmi_ix_s12"),
	snwPcSyr: integer("snw_pc_syr"),
	snwPcUyr: integer("snw_pc_uyr"),
	snwPcSmx: integer("snw_pc_smx"),
	snwPcS01: integer("snw_pc_s01"),
	snwPcS02: integer("snw_pc_s02"),
	snwPcS03: integer("snw_pc_s03"),
	snwPcS04: integer("snw_pc_s04"),
	snwPcS05: integer("snw_pc_s05"),
	snwPcS06: integer("snw_pc_s06"),
	snwPcS07: integer("snw_pc_s07"),
	snwPcS08: integer("snw_pc_s08"),
	snwPcS09: integer("snw_pc_s09"),
	snwPcS10: integer("snw_pc_s10"),
	snwPcS11: integer("snw_pc_s11"),
	snwPcS12: integer("snw_pc_s12"),
	glcClSmj: integer("glc_cl_smj"),
	glcPcS01: integer("glc_pc_s01"),
	glcPcS02: integer("glc_pc_s02"),
	glcPcS03: integer("glc_pc_s03"),
	glcPcS04: integer("glc_pc_s04"),
	glcPcS05: integer("glc_pc_s05"),
	glcPcS06: integer("glc_pc_s06"),
	glcPcS07: integer("glc_pc_s07"),
	glcPcS08: integer("glc_pc_s08"),
	glcPcS09: integer("glc_pc_s09"),
	glcPcS10: integer("glc_pc_s10"),
	glcPcS11: integer("glc_pc_s11"),
	glcPcS12: integer("glc_pc_s12"),
	glcPcS13: integer("glc_pc_s13"),
	glcPcS14: integer("glc_pc_s14"),
	glcPcS15: integer("glc_pc_s15"),
	glcPcS16: integer("glc_pc_s16"),
	glcPcS17: integer("glc_pc_s17"),
	glcPcS18: integer("glc_pc_s18"),
	glcPcS19: integer("glc_pc_s19"),
	glcPcS20: integer("glc_pc_s20"),
	glcPcS21: integer("glc_pc_s21"),
	glcPcS22: integer("glc_pc_s22"),
	glcPcU01: integer("glc_pc_u01"),
	glcPcU02: integer("glc_pc_u02"),
	glcPcU03: integer("glc_pc_u03"),
	glcPcU04: integer("glc_pc_u04"),
	glcPcU05: integer("glc_pc_u05"),
	glcPcU06: integer("glc_pc_u06"),
	glcPcU07: integer("glc_pc_u07"),
	glcPcU08: integer("glc_pc_u08"),
	glcPcU09: integer("glc_pc_u09"),
	glcPcU10: integer("glc_pc_u10"),
	glcPcU11: integer("glc_pc_u11"),
	glcPcU12: integer("glc_pc_u12"),
	glcPcU13: integer("glc_pc_u13"),
	glcPcU14: integer("glc_pc_u14"),
	glcPcU15: integer("glc_pc_u15"),
	glcPcU16: integer("glc_pc_u16"),
	glcPcU17: integer("glc_pc_u17"),
	glcPcU18: integer("glc_pc_u18"),
	glcPcU19: integer("glc_pc_u19"),
	glcPcU20: integer("glc_pc_u20"),
	glcPcU21: integer("glc_pc_u21"),
	glcPcU22: integer("glc_pc_u22"),
	pnvClSmj: integer("pnv_cl_smj"),
	pnvPcS01: integer("pnv_pc_s01"),
	pnvPcS02: integer("pnv_pc_s02"),
	pnvPcS03: integer("pnv_pc_s03"),
	pnvPcS04: integer("pnv_pc_s04"),
	pnvPcS05: integer("pnv_pc_s05"),
	pnvPcS06: integer("pnv_pc_s06"),
	pnvPcS07: integer("pnv_pc_s07"),
	pnvPcS08: integer("pnv_pc_s08"),
	pnvPcS09: integer("pnv_pc_s09"),
	pnvPcS10: integer("pnv_pc_s10"),
	pnvPcS11: integer("pnv_pc_s11"),
	pnvPcS12: integer("pnv_pc_s12"),
	pnvPcS13: integer("pnv_pc_s13"),
	pnvPcS14: integer("pnv_pc_s14"),
	pnvPcS15: integer("pnv_pc_s15"),
	pnvPcU01: integer("pnv_pc_u01"),
	pnvPcU02: integer("pnv_pc_u02"),
	pnvPcU03: integer("pnv_pc_u03"),
	pnvPcU04: integer("pnv_pc_u04"),
	pnvPcU05: integer("pnv_pc_u05"),
	pnvPcU06: integer("pnv_pc_u06"),
	pnvPcU07: integer("pnv_pc_u07"),
	pnvPcU08: integer("pnv_pc_u08"),
	pnvPcU09: integer("pnv_pc_u09"),
	pnvPcU10: integer("pnv_pc_u10"),
	pnvPcU11: integer("pnv_pc_u11"),
	pnvPcU12: integer("pnv_pc_u12"),
	pnvPcU13: integer("pnv_pc_u13"),
	pnvPcU14: integer("pnv_pc_u14"),
	pnvPcU15: integer("pnv_pc_u15"),
	wetClSmj: integer("wet_cl_smj"),
	wetPcSg1: integer("wet_pc_sg1"),
	wetPcUg1: integer("wet_pc_ug1"),
	wetPcSg2: integer("wet_pc_sg2"),
	wetPcUg2: integer("wet_pc_ug2"),
	wetPcS01: integer("wet_pc_s01"),
	wetPcS02: integer("wet_pc_s02"),
	wetPcS03: integer("wet_pc_s03"),
	wetPcS04: integer("wet_pc_s04"),
	wetPcS05: integer("wet_pc_s05"),
	wetPcS06: integer("wet_pc_s06"),
	wetPcS07: integer("wet_pc_s07"),
	wetPcS08: integer("wet_pc_s08"),
	wetPcS09: integer("wet_pc_s09"),
	wetPcU01: integer("wet_pc_u01"),
	wetPcU02: integer("wet_pc_u02"),
	wetPcU03: integer("wet_pc_u03"),
	wetPcU04: integer("wet_pc_u04"),
	wetPcU05: integer("wet_pc_u05"),
	wetPcU06: integer("wet_pc_u06"),
	wetPcU07: integer("wet_pc_u07"),
	wetPcU08: integer("wet_pc_u08"),
	wetPcU09: integer("wet_pc_u09"),
	forPcSse: integer("for_pc_sse"),
	forPcUse: integer("for_pc_use"),
	crpPcSse: integer("crp_pc_sse"),
	crpPcUse: integer("crp_pc_use"),
	pstPcSse: integer("pst_pc_sse"),
	pstPcUse: integer("pst_pc_use"),
	irePcSse: integer("ire_pc_sse"),
	irePcUse: integer("ire_pc_use"),
	glaPcSse: integer("gla_pc_sse"),
	glaPcUse: integer("gla_pc_use"),
	prmPcSse: integer("prm_pc_sse"),
	prmPcUse: integer("prm_pc_use"),
	pacPcSse: integer("pac_pc_sse"),
	pacPcUse: integer("pac_pc_use"),
	tbiClSmj: integer("tbi_cl_smj"),
	tecClSmj: integer("tec_cl_smj"),
	fmhClSmj: integer("fmh_cl_smj"),
	fecClSmj: integer("fec_cl_smj"),
	clyPcSav: integer("cly_pc_sav"),
	clyPcUav: integer("cly_pc_uav"),
	sltPcSav: integer("slt_pc_sav"),
	sltPcUav: integer("slt_pc_uav"),
	sndPcSav: integer("snd_pc_sav"),
	sndPcUav: integer("snd_pc_uav"),
	socThSav: integer("soc_th_sav"),
	socThUav: integer("soc_th_uav"),
	swcPcSyr: integer("swc_pc_syr"),
	swcPcUyr: integer("swc_pc_uyr"),
	swcPcS01: integer("swc_pc_s01"),
	swcPcS02: integer("swc_pc_s02"),
	swcPcS03: integer("swc_pc_s03"),
	swcPcS04: integer("swc_pc_s04"),
	swcPcS05: integer("swc_pc_s05"),
	swcPcS06: integer("swc_pc_s06"),
	swcPcS07: integer("swc_pc_s07"),
	swcPcS08: integer("swc_pc_s08"),
	swcPcS09: integer("swc_pc_s09"),
	swcPcS10: integer("swc_pc_s10"),
	swcPcS11: integer("swc_pc_s11"),
	swcPcS12: integer("swc_pc_s12"),
	litClSmj: integer("lit_cl_smj"),
	karPcSse: integer("kar_pc_sse"),
	karPcUse: integer("kar_pc_use"),
	eroKhSav: integer("ero_kh_sav"),
	eroKhUav: integer("ero_kh_uav"),
	popCtSsu: doublePrecision("pop_ct_ssu"),
	popCtUsu: doublePrecision("pop_ct_usu"),
	ppdPkSav: doublePrecision("ppd_pk_sav"),
	ppdPkUav: doublePrecision("ppd_pk_uav"),
	urbPcSse: integer("urb_pc_sse"),
	urbPcUse: integer("urb_pc_use"),
	nliIxSav: integer("nli_ix_sav"),
	nliIxUav: integer("nli_ix_uav"),
	rddMkSav: integer("rdd_mk_sav"),
	rddMkUav: integer("rdd_mk_uav"),
	hftIxS93: integer("hft_ix_s93"),
	hftIxU93: integer("hft_ix_u93"),
	hftIxS09: integer("hft_ix_s09"),
	hftIxU09: integer("hft_ix_u09"),
	gadIdSmj: integer("gad_id_smj"),
	gdpUdSav: integer("gdp_ud_sav"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	gdpUdSsu: bigint("gdp_ud_ssu", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	gdpUdUsu: bigint("gdp_ud_usu", { mode: "number" }),
	hdiIxSav: integer("hdi_ix_sav"),
});
export const baciaRioDaPrataInRioDaPrata = baciaRioDaPrataInMonitoramento;


export const banhadoRioDaPrataInMonitoramento = monitoramento.table("Banhado_Rio_Da_Prata", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().notNull(),
	geom: geometry({ type: "multipolygon", srid: 4674 }), // Updated SRID
});
export const banhadoRioDaPrataInRioDaPrata = banhadoRioDaPrataInMonitoramento;


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