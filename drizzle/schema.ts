import { pgTable, check, integer, varchar, serial, text, boolean, doublePrecision, geometry, pgView } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const spatialRefSys = pgTable("spatial_ref_sys", {
	srid: integer().primaryKey().notNull(),
	authName: varchar("auth_name", { length: 256 }),
	authSrid: integer("auth_srid"),
	srtext: varchar({ length: 2048 }),
	proj4Text: varchar({ length: 2048 }),
}, (table) => [
	check("spatial_ref_sys_srid_check", sql`(srid > 0) AND (srid <= 998999)`),
]);

export const usGaz = pgTable("us_gaz", {
	id: serial().primaryKey().notNull(),
	seq: integer(),
	word: text(),
	stdword: text(),
	token: integer(),
	isCustom: boolean("is_custom").default(true).notNull(),
});

export const usRules = pgTable("us_rules", {
	id: serial().primaryKey().notNull(),
	rule: text(),
	isCustom: boolean("is_custom").default(true).notNull(),
});

export const pointcloudFormats = pgTable("pointcloud_formats", {
	pcid: integer().primaryKey().notNull(),
	srid: integer(),
	schema: text(),
}, (table) => [
	check("pointcloud_formats_pcid_check", sql`(pcid > 0) AND (pcid < 65536)`),
	check("pointcloud_formats_schema_check", sql`CHECK (pc_schemaisvalid(schema`),
]);

export const usLex = pgTable("us_lex", {
	id: serial().primaryKey().notNull(),
	seq: integer(),
	word: text(),
	stdword: text(),
	token: integer(),
	isCustom: boolean("is_custom").default(true).notNull(),
});

export const banhado = pgTable("banhado", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	area: doublePrecision(),
	geom: geometry({ type: "multipolygon", srid: 4326 }),
});
export const geographyColumns = pgView("geography_columns", {	// TODO: failed to parse database type 'name'
	fTableCatalog: unknown("f_table_catalog"),
	// TODO: failed to parse database type 'name'
	fTableSchema: unknown("f_table_schema"),
	// TODO: failed to parse database type 'name'
	fTableName: unknown("f_table_name"),
	// TODO: failed to parse database type 'name'
	fGeographyColumn: unknown("f_geography_column"),
	coordDimension: integer("coord_dimension"),
	srid: integer(),
	type: text(),
}).as(sql`SELECT current_database() AS f_table_catalog, n.nspname AS f_table_schema, c.relname AS f_table_name, a.attname AS f_geography_column, postgis_typmod_dims(a.atttypmod) AS coord_dimension, postgis_typmod_srid(a.atttypmod) AS srid, postgis_typmod_type(a.atttypmod) AS type FROM pg_class c, pg_attribute a, pg_type t, pg_namespace n WHERE t.typname = 'geography'::name AND a.attisdropped = false AND a.atttypid = t.oid AND a.attrelid = c.oid AND c.relnamespace = n.oid AND (c.relkind = ANY (ARRAY['r'::"char", 'v'::"char", 'm'::"char", 'f'::"char", 'p'::"char"])) AND NOT pg_is_other_temp_schema(c.relnamespace) AND has_table_privilege(c.oid, 'SELECT'::text)`);

export const geometryColumns = pgView("geometry_columns", {	fTableCatalog: varchar("f_table_catalog", { length: 256 }),
	// TODO: failed to parse database type 'name'
	fTableSchema: unknown("f_table_schema"),
	// TODO: failed to parse database type 'name'
	fTableName: unknown("f_table_name"),
	// TODO: failed to parse database type 'name'
	fGeometryColumn: unknown("f_geometry_column"),
	coordDimension: integer("coord_dimension"),
	srid: integer(),
	type: varchar({ length: 30 }),
}).as(sql`SELECT current_database()::character varying(256) AS f_table_catalog, n.nspname AS f_table_schema, c.relname AS f_table_name, a.attname AS f_geometry_column, COALESCE(postgis_typmod_dims(a.atttypmod), sn.ndims, 2) AS coord_dimension, COALESCE(NULLIF(postgis_typmod_srid(a.atttypmod), 0), sr.srid, 0) AS srid, replace(replace(COALESCE(NULLIF(upper(postgis_typmod_type(a.atttypmod)), 'GEOMETRY'::text), st.type, 'GEOMETRY'::text), 'ZM'::text, ''::text), 'Z'::text, ''::text)::character varying(30) AS type FROM pg_class c JOIN pg_attribute a ON a.attrelid = c.oid AND NOT a.attisdropped JOIN pg_namespace n ON c.relnamespace = n.oid JOIN pg_type t ON a.atttypid = t.oid LEFT JOIN ( SELECT s.connamespace, s.conrelid, s.conkey, replace(split_part(s.consrc, ''''::text, 2), ')'::text, ''::text) AS type FROM ( SELECT pg_constraint.connamespace, pg_constraint.conrelid, pg_constraint.conkey, pg_get_constraintdef(pg_constraint.oid) AS consrc FROM pg_constraint) s WHERE s.consrc ~~* '%geometrytype(% = %'::text) st ON st.connamespace = n.oid AND st.conrelid = c.oid AND (a.attnum = ANY (st.conkey)) LEFT JOIN ( SELECT s.connamespace, s.conrelid, s.conkey, replace(split_part(s.consrc, ' = '::text, 2), ')'::text, ''::text)::integer AS ndims FROM ( SELECT pg_constraint.connamespace, pg_constraint.conrelid, pg_constraint.conkey, pg_get_constraintdef(pg_constraint.oid) AS consrc FROM pg_constraint) s WHERE s.consrc ~~* '%ndims(% = %'::text) sn ON sn.connamespace = n.oid AND sn.conrelid = c.oid AND (a.attnum = ANY (sn.conkey)) LEFT JOIN ( SELECT s.connamespace, s.conrelid, s.conkey, replace(replace(split_part(s.consrc, ' = '::text, 2), ')'::text, ''::text), '('::text, ''::text)::integer AS srid FROM ( SELECT pg_constraint.connamespace, pg_constraint.conrelid, pg_constraint.conkey, pg_get_constraintdef(pg_constraint.oid) AS consrc FROM pg_constraint) s WHERE s.consrc ~~* '%srid(% = %'::text) sr ON sr.connamespace = n.oid AND sr.conrelid = c.oid AND (a.attnum = ANY (sr.conkey)) WHERE (c.relkind = ANY (ARRAY['r'::"char", 'v'::"char", 'm'::"char", 'f'::"char", 'p'::"char"])) AND NOT c.relname = 'raster_columns'::name AND t.typname = 'geometry'::name AND NOT pg_is_other_temp_schema(c.relnamespace) AND has_table_privilege(c.oid, 'SELECT'::text)`);

export const rasterColumns = pgView("raster_columns", {	// TODO: failed to parse database type 'name'
	rTableCatalog: unknown("r_table_catalog"),
	// TODO: failed to parse database type 'name'
	rTableSchema: unknown("r_table_schema"),
	// TODO: failed to parse database type 'name'
	rTableName: unknown("r_table_name"),
	// TODO: failed to parse database type 'name'
	rRasterColumn: unknown("r_raster_column"),
	srid: integer(),
	scaleX: doublePrecision("scale_x"),
	scaleY: doublePrecision("scale_y"),
	blocksizeX: integer("blocksize_x"),
	blocksizeY: integer("blocksize_y"),
	sameAlignment: boolean("same_alignment"),
	regularBlocking: boolean("regular_blocking"),
	numBands: integer("num_bands"),
	pixelTypes: text("pixel_types"),
	nodataValues: doublePrecision("nodata_values"),
	outDb: boolean("out_db"),
	extent: geometry(),
	spatialIndex: boolean("spatial_index"),
}).as(sql`SELECT current_database() AS r_table_catalog, n.nspname AS r_table_schema, c.relname AS r_table_name, a.attname AS r_raster_column, COALESCE(_raster_constraint_info_srid(n.nspname, c.relname, a.attname), ( SELECT st_srid('010100000000000000000000000000000000000000'::geometry) AS st_srid)) AS srid, _raster_constraint_info_scale(n.nspname, c.relname, a.attname, 'x'::bpchar) AS scale_x, _raster_constraint_info_scale(n.nspname, c.relname, a.attname, 'y'::bpchar) AS scale_y, _raster_constraint_info_blocksize(n.nspname, c.relname, a.attname, 'width'::text) AS blocksize_x, _raster_constraint_info_blocksize(n.nspname, c.relname, a.attname, 'height'::text) AS blocksize_y, COALESCE(_raster_constraint_info_alignment(n.nspname, c.relname, a.attname), false) AS same_alignment, COALESCE(_raster_constraint_info_regular_blocking(n.nspname, c.relname, a.attname), false) AS regular_blocking, _raster_constraint_info_num_bands(n.nspname, c.relname, a.attname) AS num_bands, _raster_constraint_info_pixel_types(n.nspname, c.relname, a.attname) AS pixel_types, _raster_constraint_info_nodata_values(n.nspname, c.relname, a.attname) AS nodata_values, _raster_constraint_info_out_db(n.nspname, c.relname, a.attname) AS out_db, _raster_constraint_info_extent(n.nspname, c.relname, a.attname) AS extent, COALESCE(_raster_constraint_info_index(n.nspname, c.relname, a.attname), false) AS spatial_index FROM pg_class c, pg_attribute a, pg_type t, pg_namespace n WHERE t.typname = 'raster'::name AND a.attisdropped = false AND a.atttypid = t.oid AND a.attrelid = c.oid AND c.relnamespace = n.oid AND (c.relkind = ANY (ARRAY['r'::"char", 'v'::"char", 'm'::"char", 'f'::"char", 'p'::"char"])) AND NOT pg_is_other_temp_schema(c.relnamespace) AND has_table_privilege(c.oid, 'SELECT'::text)`);

export const rasterOverviews = pgView("raster_overviews", {	// TODO: failed to parse database type 'name'
	oTableCatalog: unknown("o_table_catalog"),
	// TODO: failed to parse database type 'name'
	oTableSchema: unknown("o_table_schema"),
	// TODO: failed to parse database type 'name'
	oTableName: unknown("o_table_name"),
	// TODO: failed to parse database type 'name'
	oRasterColumn: unknown("o_raster_column"),
	// TODO: failed to parse database type 'name'
	rTableCatalog: unknown("r_table_catalog"),
	// TODO: failed to parse database type 'name'
	rTableSchema: unknown("r_table_schema"),
	// TODO: failed to parse database type 'name'
	rTableName: unknown("r_table_name"),
	// TODO: failed to parse database type 'name'
	rRasterColumn: unknown("r_raster_column"),
	overviewFactor: integer("overview_factor"),
}).as(sql`SELECT current_database() AS o_table_catalog, n.nspname AS o_table_schema, c.relname AS o_table_name, a.attname AS o_raster_column, current_database() AS r_table_catalog, split_part(split_part(s.consrc, '''::name'::text, 1), ''''::text, 2)::name AS r_table_schema, split_part(split_part(s.consrc, '''::name'::text, 2), ''''::text, 2)::name AS r_table_name, split_part(split_part(s.consrc, '''::name'::text, 3), ''''::text, 2)::name AS r_raster_column, btrim(split_part(s.consrc, ','::text, 2))::integer AS overview_factor FROM pg_class c, pg_attribute a, pg_type t, pg_namespace n, ( SELECT pg_constraint.connamespace, pg_constraint.conrelid, pg_constraint.conkey, pg_get_constraintdef(pg_constraint.oid) AS consrc FROM pg_constraint) s WHERE t.typname = 'raster'::name AND a.attisdropped = false AND a.atttypid = t.oid AND a.attrelid = c.oid AND c.relnamespace = n.oid AND (c.relkind::text = ANY (ARRAY['r'::character(1), 'v'::character(1), 'm'::character(1), 'f'::character(1)]::text[])) AND s.connamespace = n.oid AND s.conrelid = c.oid AND s.consrc ~~ '%_overview_constraint(%'::text AND NOT pg_is_other_temp_schema(c.relnamespace) AND has_table_privilege(c.oid, 'SELECT'::text)`);

export const pointcloudColumns = pgView("pointcloud_columns", {	// TODO: failed to parse database type 'name'
	schema: unknown("schema"),
	// TODO: failed to parse database type 'name'
	table: unknown("table"),
	// TODO: failed to parse database type 'name'
	column: unknown("column"),
	pcid: integer(),
	srid: integer(),
	// TODO: failed to parse database type 'name'
	type: unknown("type"),
}).as(sql`SELECT n.nspname AS schema, c.relname AS "table", a.attname AS "column", pc_typmod_pcid(a.atttypmod) AS pcid, p.srid, t.typname AS type FROM pg_class c, pg_type t, pg_namespace n, pg_attribute a LEFT JOIN pointcloud_formats p ON pc_typmod_pcid(a.atttypmod) = p.pcid WHERE (t.typname = ANY (ARRAY['pcpatch'::name, 'pcpoint'::name])) AND a.attisdropped = false AND a.atttypid = t.oid AND a.attrelid = c.oid AND c.relnamespace = n.oid AND NOT pg_is_other_temp_schema(c.relnamespace) AND has_table_privilege(c.oid, 'SELECT'::text)`);