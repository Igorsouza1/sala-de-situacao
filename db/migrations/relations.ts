import { relations } from "drizzle-orm/relations";
import { regioesInMonitoramento, acoesInMonitoramento, trilhasInMonitoramento, fotosAcoesInMonitoramento, waypointsInMonitoramento, rawFirmsInMonitoramento, layerCatalogInMonitoramento, layerDataInMonitoramento, desmatamentoInMonitoramento, estradasInMonitoramento, propriedadesInMonitoramento } from "./schema";

export const acoesInMonitoramentoRelations = relations(acoesInMonitoramento, ({one, many}) => ({
	regioesInMonitoramento: one(regioesInMonitoramento, {
		fields: [acoesInMonitoramento.regiaoId],
		references: [regioesInMonitoramento.id]
	}),
	fotosAcoesInMonitoramentos: many(fotosAcoesInMonitoramento),
}));

export const regioesInMonitoramentoRelations = relations(regioesInMonitoramento, ({many}) => ({
	acoesInMonitoramentos: many(acoesInMonitoramento),
	trilhasInMonitoramentos: many(trilhasInMonitoramento),
	waypointsInMonitoramentos: many(waypointsInMonitoramento),
	rawFirmsInMonitoramentos: many(rawFirmsInMonitoramento),
	desmatamentoInMonitoramentos: many(desmatamentoInMonitoramento),
	estradasInMonitoramentos: many(estradasInMonitoramento),
	propriedadesInMonitoramentos: many(propriedadesInMonitoramento),
}));

export const trilhasInMonitoramentoRelations = relations(trilhasInMonitoramento, ({one, many}) => ({
	regioesInMonitoramento: one(regioesInMonitoramento, {
		fields: [trilhasInMonitoramento.regiaoId],
		references: [regioesInMonitoramento.id]
	}),
	waypointsInMonitoramentos: many(waypointsInMonitoramento),
}));

export const fotosAcoesInMonitoramentoRelations = relations(fotosAcoesInMonitoramento, ({one}) => ({
	acoesInMonitoramento: one(acoesInMonitoramento, {
		fields: [fotosAcoesInMonitoramento.acaoId],
		references: [acoesInMonitoramento.id]
	}),
}));

export const waypointsInMonitoramentoRelations = relations(waypointsInMonitoramento, ({one}) => ({
	regioesInMonitoramento: one(regioesInMonitoramento, {
		fields: [waypointsInMonitoramento.regiaoId],
		references: [regioesInMonitoramento.id]
	}),
	trilhasInMonitoramento: one(trilhasInMonitoramento, {
		fields: [waypointsInMonitoramento.trilhaId],
		references: [trilhasInMonitoramento.id]
	}),
}));

export const rawFirmsInMonitoramentoRelations = relations(rawFirmsInMonitoramento, ({one}) => ({
	regioesInMonitoramento: one(regioesInMonitoramento, {
		fields: [rawFirmsInMonitoramento.regiaoId],
		references: [regioesInMonitoramento.id]
	}),
}));

export const layerDataInMonitoramentoRelations = relations(layerDataInMonitoramento, ({one}) => ({
	layerCatalogInMonitoramento: one(layerCatalogInMonitoramento, {
		fields: [layerDataInMonitoramento.layerId],
		references: [layerCatalogInMonitoramento.id]
	}),
}));

export const layerCatalogInMonitoramentoRelations = relations(layerCatalogInMonitoramento, ({many}) => ({
	layerDataInMonitoramentos: many(layerDataInMonitoramento),
}));

export const desmatamentoInMonitoramentoRelations = relations(desmatamentoInMonitoramento, ({one}) => ({
	regioesInMonitoramento: one(regioesInMonitoramento, {
		fields: [desmatamentoInMonitoramento.regiaoId],
		references: [regioesInMonitoramento.id]
	}),
}));

export const estradasInMonitoramentoRelations = relations(estradasInMonitoramento, ({one}) => ({
	regioesInMonitoramento: one(regioesInMonitoramento, {
		fields: [estradasInMonitoramento.regiaoId],
		references: [regioesInMonitoramento.id]
	}),
}));

export const propriedadesInMonitoramentoRelations = relations(propriedadesInMonitoramento, ({one}) => ({
	regioesInMonitoramento: one(regioesInMonitoramento, {
		fields: [propriedadesInMonitoramento.regiaoId],
		references: [regioesInMonitoramento.id]
	}),
}));