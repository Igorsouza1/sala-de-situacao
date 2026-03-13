CREATE TABLE IF NOT EXISTS "monitoramento"."javali_avistamentos" (
	"id" serial PRIMARY KEY NOT NULL,
	"tipo" varchar(100) NOT NULL,
	"observacoes" text,
	"geom" geometry(point, 4674) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
