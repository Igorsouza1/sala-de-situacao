-- Rename Schema
ALTER SCHEMA "rio_da_prata" RENAME TO "monitoramento";

-- Create New Tables (Type B)
CREATE TABLE IF NOT EXISTS "monitoramento"."layer_catalog" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"schema_config" jsonb,
	"visual_config" jsonb,
	CONSTRAINT "layer_catalog_slug_unique" UNIQUE("slug")
);

CREATE TABLE IF NOT EXISTS "monitoramento"."layer_data" (
	"id" serial PRIMARY KEY NOT NULL,
	"layer_id" integer,
	"geom" geometry(geometry, 4674),
	"properties" jsonb,
	"data_registro" timestamp
);

-- Modify Regions Table (Exists in renamed schema)
ALTER TABLE "monitoramento"."regioes" ADD COLUMN IF NOT EXISTS "slug" text;
ALTER TABLE "monitoramento"."regioes" ADD COLUMN IF NOT EXISTS "metadata" jsonb;
ALTER TABLE "monitoramento"."regioes" DROP CONSTRAINT IF EXISTS "regioes_slug_unique";
ALTER TABLE "monitoramento"."regioes" ADD CONSTRAINT "regioes_slug_unique" UNIQUE("slug");

-- Add regiao_id and other columns to Core Tables
ALTER TABLE "monitoramento"."acoes" ADD COLUMN IF NOT EXISTS "regiao_id" integer;
ALTER TABLE "monitoramento"."desmatamento" ADD COLUMN IF NOT EXISTS "regiao_id" integer;
ALTER TABLE "monitoramento"."estradas" ADD COLUMN IF NOT EXISTS "regiao_id" integer;
ALTER TABLE "monitoramento"."fotos_acoes" ADD COLUMN IF NOT EXISTS "atualizacao" date;
ALTER TABLE "monitoramento"."propriedades" ADD COLUMN IF NOT EXISTS "nome" text;
ALTER TABLE "monitoramento"."propriedades" ADD COLUMN IF NOT EXISTS "regiao_id" integer;
ALTER TABLE "monitoramento"."propriedades" ADD COLUMN IF NOT EXISTS "properties" jsonb;
ALTER TABLE "monitoramento"."raw_firms" ADD COLUMN IF NOT EXISTS "regiao_id" integer;
ALTER TABLE "monitoramento"."trilhas" ADD COLUMN IF NOT EXISTS "regiao_id" integer;
ALTER TABLE "monitoramento"."waypoints" ADD COLUMN IF NOT EXISTS "regiao_id" integer;

-- Update SRIDs (4326 -> 4674) using ST_Transform
-- We use USING to transform existing data.

ALTER TABLE "monitoramento"."regioes" ALTER COLUMN "geom" TYPE geometry(multipolygon, 4674) USING ST_Transform(geom, 4674);
ALTER TABLE "monitoramento"."acoes" ALTER COLUMN "geom" TYPE geometry(pointz, 4674) USING ST_Transform(geom, 4674);
ALTER TABLE "monitoramento"."trilhas" ALTER COLUMN "geom" TYPE geometry(multilinestringz, 4674) USING ST_Transform(geom, 4674);
ALTER TABLE "monitoramento"."waypoints" ALTER COLUMN "geom" TYPE geometry(pointz, 4674) USING ST_Transform(geom, 4674);
ALTER TABLE "monitoramento"."estradas" ALTER COLUMN "geom" TYPE geometry(multilinestringz, 4674) USING ST_Transform(geom, 4674);
ALTER TABLE "monitoramento"."desmatamento" ALTER COLUMN "geom" TYPE geometry(geometry, 4674) USING ST_Transform(geom, 4674);
ALTER TABLE "monitoramento"."propriedades" ALTER COLUMN "geom" TYPE geometry(multipolygon, 4674) USING ST_Transform(geom, 4674);

-- Legacy tables SRID update
ALTER TABLE "monitoramento"."Bacia_Rio_Da_Prata" ALTER COLUMN "geom" TYPE geometry(multipolygon, 4674) USING ST_Transform(geom, 4674);
ALTER TABLE "monitoramento"."Banhado_Rio_Da_Prata" ALTER COLUMN "geom" TYPE geometry(multipolygon, 4674) USING ST_Transform(geom, 4674);
ALTER TABLE "monitoramento"."Leito_Rio_Da_Prata" ALTER COLUMN "geom" TYPE geometry(multilinestringz, 4674) USING ST_Transform(geom, 4674);

-- Add Foreign Keys
DO $$ BEGIN
 ALTER TABLE "monitoramento"."layer_data" ADD CONSTRAINT "layer_data_layer_id_layer_catalog_id_fk" FOREIGN KEY ("layer_id") REFERENCES "monitoramento"."layer_catalog"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
 ALTER TABLE "monitoramento"."acoes" ADD CONSTRAINT "acoes_regiao_id_regioes_id_fk" FOREIGN KEY ("regiao_id") REFERENCES "monitoramento"."regioes"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
 ALTER TABLE "monitoramento"."desmatamento" ADD CONSTRAINT "desmatamento_regiao_id_regioes_id_fk" FOREIGN KEY ("regiao_id") REFERENCES "monitoramento"."regioes"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
 ALTER TABLE "monitoramento"."estradas" ADD CONSTRAINT "estradas_regiao_id_regioes_id_fk" FOREIGN KEY ("regiao_id") REFERENCES "monitoramento"."regioes"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
 ALTER TABLE "monitoramento"."propriedades" ADD CONSTRAINT "propriedades_regiao_id_regioes_id_fk" FOREIGN KEY ("regiao_id") REFERENCES "monitoramento"."regioes"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
 ALTER TABLE "monitoramento"."raw_firms" ADD CONSTRAINT "raw_firms_regiao_id_regioes_id_fk" FOREIGN KEY ("regiao_id") REFERENCES "monitoramento"."regioes"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
 ALTER TABLE "monitoramento"."trilhas" ADD CONSTRAINT "trilhas_regiao_id_regioes_id_fk" FOREIGN KEY ("regiao_id") REFERENCES "monitoramento"."regioes"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
 ALTER TABLE "monitoramento"."waypoints" ADD CONSTRAINT "waypoints_regiao_id_regioes_id_fk" FOREIGN KEY ("regiao_id") REFERENCES "monitoramento"."regioes"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Indices
CREATE INDEX IF NOT EXISTS "idx_layer_data_geom" ON "monitoramento"."layer_data" USING gist ("geom");
CREATE INDEX IF NOT EXISTS "idx_layer_data_data_registro" ON "monitoramento"."layer_data" USING btree ("data_registro");
-- Recreate index on regioes (SRID changed)
DROP INDEX IF EXISTS "monitoramento"."idx_regioes_geom";
CREATE INDEX "idx_regioes_geom" ON "monitoramento"."regioes" USING gist ("geom" gist_geometry_ops_2d);