CREATE TABLE "monitoramento"."destinatarios_alertas" (
	"id" serial PRIMARY KEY NOT NULL,
	"regiao_id" integer NOT NULL,
	"email" varchar(255) NOT NULL,
	"preferencias" jsonb DEFAULT '{"fogo":true}'::jsonb,
	"ativo" boolean DEFAULT true
);
--> statement-breakpoint
ALTER TABLE "monitoramento"."acoes" ADD COLUMN "eixo_tematico" varchar(100);--> statement-breakpoint
ALTER TABLE "monitoramento"."acoes" ADD COLUMN "tipo_tecnico" varchar(100);--> statement-breakpoint
ALTER TABLE "monitoramento"."acoes" ADD COLUMN "carater" varchar(50);--> statement-breakpoint
ALTER TABLE "monitoramento"."layer_catalog" ADD COLUMN "ordering" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "monitoramento"."layer_catalog" ADD COLUMN "color_hex" text;--> statement-breakpoint
ALTER TABLE "monitoramento"."layer_catalog" ADD COLUMN "regiao_id" integer;--> statement-breakpoint
ALTER TABLE "monitoramento"."raw_firms" ADD COLUMN "alerta_enviado" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "monitoramento"."raw_firms" ADD COLUMN "cod_imovel" varchar(100);--> statement-breakpoint
ALTER TABLE "monitoramento"."destinatarios_alertas" ADD CONSTRAINT "destinatarios_alertas_regiao_id_regioes_id_fk" FOREIGN KEY ("regiao_id") REFERENCES "monitoramento"."regioes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monitoramento"."layer_catalog" ADD CONSTRAINT "layer_catalog_regiao_id_regioes_id_fk" FOREIGN KEY ("regiao_id") REFERENCES "monitoramento"."regioes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_firms_point_unique" ON "monitoramento"."raw_firms" USING btree ("latitude" date_ops,"longitude" float8_ops,"acq_date" date_ops,"acq_time" text_ops);