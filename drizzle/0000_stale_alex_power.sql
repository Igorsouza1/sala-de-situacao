CREATE TABLE "acoes" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"latitude" double precision NOT NULL,
	"longitude" double precision NOT NULL,
	"elevation" double precision,
	"time" timestamp NOT NULL,
	"descricao" text,
	"mes" text,
	"atuacao" text,
	"acao" text,
	"geom" geometry(point)
);
--> statement-breakpoint
CREATE TABLE "deque_de_pedras" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"coordinates" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "desmatamento" (
	"id" serial PRIMARY KEY NOT NULL,
	"geom" text,
	"detectat" timestamp,
	"detectyear" integer,
	"stateha" double precision,
	"alertha" double precision,
	"alertid" text,
	"alertcode" text,
	"state" text,
	"source" text
);
--> statement-breakpoint
CREATE TABLE "estradas" (
	"id" serial PRIMARY KEY NOT NULL,
	"geom" text,
	"nome" text,
	"tipo" text,
	"codigo" text
);
--> statement-breakpoint
CREATE TABLE "ponte_do_cure" (
	"id" serial PRIMARY KEY NOT NULL,
	"geom" text,
	"local" text,
	"mes" text,
	"data" date,
	"chuva" double precision,
	"nivel" double precision,
	"visibilidade" text
);
--> statement-breakpoint
CREATE TABLE "propriedades" (
	"id" serial PRIMARY KEY NOT NULL,
	"geom" text,
	"cod_tema" text,
	"nom_tema" text,
	"cod_imovel" text,
	"mod_fiscal" double precision,
	"num_area" double precision,
	"ind_status" text,
	"ind_tipo" text,
	"des_condic" text,
	"municipio" text
);
--> statement-breakpoint
CREATE TABLE "raw_firms" (
	"latitude" double precision,
	"longitude" double precision,
	"bright_ti4" double precision,
	"scan" double precision,
	"track" double precision,
	"acq_date" date,
	"acq_time" integer,
	"bright_ti5" double precision,
	"frp" double precision,
	"type" integer,
	"hora_deteccao" timestamp,
	"geom" text,
	"satellite" text,
	"instrument" text,
	"confidence" text,
	"version" text,
	"daynight" text
);
