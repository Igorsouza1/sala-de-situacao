-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE "spatial_ref_sys" (
	"srid" integer PRIMARY KEY NOT NULL,
	"auth_name" varchar(256),
	"auth_srid" integer,
	"srtext" varchar(2048),
	"proj4text" varchar(2048),
	CONSTRAINT "spatial_ref_sys_srid_check" CHECK ((srid > 0) AND (srid <= 998999))
);
--> statement-breakpoint
CREATE TABLE "us_gaz" (
	"id" serial PRIMARY KEY NOT NULL,
	"seq" integer,
	"word" text,
	"stdword" text,
	"token" integer,
	"is_custom" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "us_rules" (
	"id" serial PRIMARY KEY NOT NULL,
	"rule" text,
	"is_custom" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pointcloud_formats" (
	"pcid" integer PRIMARY KEY NOT NULL,
	"srid" integer,
	"schema" text,
	CONSTRAINT "pointcloud_formats_pcid_check" CHECK ((pcid > 0) AND (pcid < 65536)),
	CONSTRAINT "pointcloud_formats_schema_check" CHECK (CHECK (pc_schemaisvalid(schema)
);
--> statement-breakpoint
CREATE TABLE "us_lex" (
	"id" serial PRIMARY KEY NOT NULL,
	"seq" integer,
	"word" text,
	"stdword" text,
	"token" integer,
	"is_custom" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE VIEW "public"."geography_columns" AS (SELECT current_database() AS f_table_catalog, n.nspname AS f_table_schema, c.relname AS f_table_name, a.attname AS f_geography_column, postgis_typmod_dims(a.atttypmod) AS coord_dimension, postgis_typmod_srid(a.atttypmod) AS srid, postgis_typmod_type(a.atttypmod) AS type FROM pg_class c, pg_attribute a, pg_type t, pg_namespace n WHERE t.typname = 'geography'::name AND a.attisdropped = false AND a.atttypid = t.oid AND a.attrelid = c.oid AND c.relnamespace = n.oid AND (c.relkind = ANY (ARRAY['r'::"char", 'v'::"char", 'm'::"char", 'f'::"char", 'p'::"char"])) AND NOT pg_is_other_temp_schema(c.relnamespace) AND has_table_privilege(c.oid, 'SELECT'::text));--> statement-breakpoint
CREATE VIEW "public"."geometry_columns" AS (SELECT current_database()::character varying(256) AS f_table_catalog, n.nspname AS f_table_schema, c.relname AS f_table_name, a.attname AS f_geometry_column, COALESCE(postgis_typmod_dims(a.atttypmod), sn.ndims, 2) AS coord_dimension, COALESCE(NULLIF(postgis_typmod_srid(a.atttypmod), 0), sr.srid, 0) AS srid, replace(replace(COALESCE(NULLIF(upper(postgis_typmod_type(a.atttypmod)), 'GEOMETRY'::text), st.type, 'GEOMETRY'::text), 'ZM'::text, ''::text), 'Z'::text, ''::text)::character varying(30) AS type FROM pg_class c JOIN pg_attribute a ON a.attrelid = c.oid AND NOT a.attisdropped JOIN pg_namespace n ON c.relnamespace = n.oid JOIN pg_type t ON a.atttypid = t.oid LEFT JOIN ( SELECT s.connamespace, s.conrelid, s.conkey, replace(split_part(s.consrc, ''''::text, 2), ')'::text, ''::text) AS type FROM ( SELECT pg_constraint.connamespace, pg_constraint.conrelid, pg_constraint.conkey, pg_get_constraintdef(pg_constraint.oid) AS consrc FROM pg_constraint) s WHERE s.consrc ~~* '%geometrytype(% = %'::text) st ON st.connamespace = n.oid AND st.conrelid = c.oid AND (a.attnum = ANY (st.conkey)) LEFT JOIN ( SELECT s.connamespace, s.conrelid, s.conkey, replace(split_part(s.consrc, ' = '::text, 2), ')'::text, ''::text)::integer AS ndims FROM ( SELECT pg_constraint.connamespace, pg_constraint.conrelid, pg_constraint.conkey, pg_get_constraintdef(pg_constraint.oid) AS consrc FROM pg_constraint) s WHERE s.consrc ~~* '%ndims(% = %'::text) sn ON sn.connamespace = n.oid AND sn.conrelid = c.oid AND (a.attnum = ANY (sn.conkey)) LEFT JOIN ( SELECT s.connamespace, s.conrelid, s.conkey, replace(replace(split_part(s.consrc, ' = '::text, 2), ')'::text, ''::text), '('::text, ''::text)::integer AS srid FROM ( SELECT pg_constraint.connamespace, pg_constraint.conrelid, pg_constraint.conkey, pg_get_constraintdef(pg_constraint.oid) AS consrc FROM pg_constraint) s WHERE s.consrc ~~* '%srid(% = %'::text) sr ON sr.connamespace = n.oid AND sr.conrelid = c.oid AND (a.attnum = ANY (sr.conkey)) WHERE (c.relkind = ANY (ARRAY['r'::"char", 'v'::"char", 'm'::"char", 'f'::"char", 'p'::"char"])) AND NOT c.relname = 'raster_columns'::name AND t.typname = 'geometry'::name AND NOT pg_is_other_temp_schema(c.relnamespace) AND has_table_privilege(c.oid, 'SELECT'::text));--> statement-breakpoint
CREATE VIEW "public"."raster_columns" AS (SELECT current_database() AS r_table_catalog, n.nspname AS r_table_schema, c.relname AS r_table_name, a.attname AS r_raster_column, COALESCE(_raster_constraint_info_srid(n.nspname, c.relname, a.attname), ( SELECT st_srid('010100000000000000000000000000000000000000'::geometry) AS st_srid)) AS srid, _raster_constraint_info_scale(n.nspname, c.relname, a.attname, 'x'::bpchar) AS scale_x, _raster_constraint_info_scale(n.nspname, c.relname, a.attname, 'y'::bpchar) AS scale_y, _raster_constraint_info_blocksize(n.nspname, c.relname, a.attname, 'width'::text) AS blocksize_x, _raster_constraint_info_blocksize(n.nspname, c.relname, a.attname, 'height'::text) AS blocksize_y, COALESCE(_raster_constraint_info_alignment(n.nspname, c.relname, a.attname), false) AS same_alignment, COALESCE(_raster_constraint_info_regular_blocking(n.nspname, c.relname, a.attname), false) AS regular_blocking, _raster_constraint_info_num_bands(n.nspname, c.relname, a.attname) AS num_bands, _raster_constraint_info_pixel_types(n.nspname, c.relname, a.attname) AS pixel_types, _raster_constraint_info_nodata_values(n.nspname, c.relname, a.attname) AS nodata_values, _raster_constraint_info_out_db(n.nspname, c.relname, a.attname) AS out_db, _raster_constraint_info_extent(n.nspname, c.relname, a.attname) AS extent, COALESCE(_raster_constraint_info_index(n.nspname, c.relname, a.attname), false) AS spatial_index FROM pg_class c, pg_attribute a, pg_type t, pg_namespace n WHERE t.typname = 'raster'::name AND a.attisdropped = false AND a.atttypid = t.oid AND a.attrelid = c.oid AND c.relnamespace = n.oid AND (c.relkind = ANY (ARRAY['r'::"char", 'v'::"char", 'm'::"char", 'f'::"char", 'p'::"char"])) AND NOT pg_is_other_temp_schema(c.relnamespace) AND has_table_privilege(c.oid, 'SELECT'::text));--> statement-breakpoint
CREATE VIEW "public"."raster_overviews" AS (SELECT current_database() AS o_table_catalog, n.nspname AS o_table_schema, c.relname AS o_table_name, a.attname AS o_raster_column, current_database() AS r_table_catalog, split_part(split_part(s.consrc, '''::name'::text, 1), ''''::text, 2)::name AS r_table_schema, split_part(split_part(s.consrc, '''::name'::text, 2), ''''::text, 2)::name AS r_table_name, split_part(split_part(s.consrc, '''::name'::text, 3), ''''::text, 2)::name AS r_raster_column, btrim(split_part(s.consrc, ','::text, 2))::integer AS overview_factor FROM pg_class c, pg_attribute a, pg_type t, pg_namespace n, ( SELECT pg_constraint.connamespace, pg_constraint.conrelid, pg_constraint.conkey, pg_get_constraintdef(pg_constraint.oid) AS consrc FROM pg_constraint) s WHERE t.typname = 'raster'::name AND a.attisdropped = false AND a.atttypid = t.oid AND a.attrelid = c.oid AND c.relnamespace = n.oid AND (c.relkind::text = ANY (ARRAY['r'::character(1), 'v'::character(1), 'm'::character(1), 'f'::character(1)]::text[])) AND s.connamespace = n.oid AND s.conrelid = c.oid AND s.consrc ~~ '%_overview_constraint(%'::text AND NOT pg_is_other_temp_schema(c.relnamespace) AND has_table_privilege(c.oid, 'SELECT'::text));--> statement-breakpoint
CREATE VIEW "public"."pointcloud_columns" AS (SELECT n.nspname AS schema, c.relname AS "table", a.attname AS "column", pc_typmod_pcid(a.atttypmod) AS pcid, p.srid, t.typname AS type FROM pg_class c, pg_type t, pg_namespace n, pg_attribute a LEFT JOIN pointcloud_formats p ON pc_typmod_pcid(a.atttypmod) = p.pcid WHERE (t.typname = ANY (ARRAY['pcpatch'::name, 'pcpoint'::name])) AND a.attisdropped = false AND a.atttypid = t.oid AND a.attrelid = c.oid AND c.relnamespace = n.oid AND NOT pg_is_other_temp_schema(c.relnamespace) AND has_table_privilege(c.oid, 'SELECT'::text));
*/