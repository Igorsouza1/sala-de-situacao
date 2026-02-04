import { relations } from "drizzle-orm/relations";
import { regioesInMonitoramento, acoesInMonitoramento, trilhasInMonitoramento, fotosAcoesInMonitoramento, destinatariosAlertasInMonitoramento, waypointsInMonitoramento, layerCatalogInMonitoramento, layerDataInMonitoramento, desmatamentoInMonitoramento, estradasInMonitoramento, propriedadesInMonitoramento, rawFirmsInMonitoramento } from "./schema";

export const acoesInMonitoramentoRelations = relations(acoesInMonitoramento, ({one, many}) => ({
	regioesInMonitoramento_regiaoId: one(regioesInMonitoramento, {
		fields: [acoesInMonitoramento.regiaoId],
		references: [regioesInMonitoramento.id],
		relationName: "acoesInMonitoramento_regiaoId_regioesInMonitoramento_id"
	}),
	regioesInMonitoramento_regiaoId: one(regioesInMonitoramento, {
		fields: [acoesInMonitoramento.regiaoId],
		references: [regioesInMonitoramento.id],
		relationName: "acoesInMonitoramento_regiaoId_regioesInMonitoramento_id"
	}),
	fotosAcoesInMonitoramentos: many(fotosAcoesInMonitoramento),
}));

export const regioesInMonitoramentoRelations = relations(regioesInMonitoramento, ({many}) => ({
	acoesInMonitoramentos_regiaoId: many(acoesInMonitoramento, {
		relationName: "acoesInMonitoramento_regiaoId_regioesInMonitoramento_id"
	}),
	acoesInMonitoramentos_regiaoId: many(acoesInMonitoramento, {
		relationName: "acoesInMonitoramento_regiaoId_regioesInMonitoramento_id"
	}),
	trilhasInMonitoramentos: many(trilhasInMonitoramento),
	destinatariosAlertasInMonitoramentos: many(destinatariosAlertasInMonitoramento),
	waypointsInMonitoramentos: many(waypointsInMonitoramento),
	layerCatalogInMonitoramentos: many(layerCatalogInMonitoramento),
	desmatamentoInMonitoramentos: many(desmatamentoInMonitoramento),
	estradasInMonitoramentos: many(estradasInMonitoramento),
	propriedadesInMonitoramentos: many(propriedadesInMonitoramento),
	rawFirmsInMonitoramentos: many(rawFirmsInMonitoramento),
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

export const destinatariosAlertasInMonitoramentoRelations = relations(destinatariosAlertasInMonitoramento, ({one}) => ({
	regioesInMonitoramento: one(regioesInMonitoramento, {
		fields: [destinatariosAlertasInMonitoramento.regiaoId],
		references: [regioesInMonitoramento.id]
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

export const layerCatalogInMonitoramentoRelations = relations(layerCatalogInMonitoramento, ({one, many}) => ({
	regioesInMonitoramento: one(regioesInMonitoramento, {
		fields: [layerCatalogInMonitoramento.regiaoId],
		references: [regioesInMonitoramento.id]
	}),
	layerDataInMonitoramentos: many(layerDataInMonitoramento),
}));

export const layerDataInMonitoramentoRelations = relations(layerDataInMonitoramento, ({one}) => ({
	layerCatalogInMonitoramento: one(layerCatalogInMonitoramento, {
		fields: [layerDataInMonitoramento.layerId],
		references: [layerCatalogInMonitoramento.id]
	}),
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

export const rawFirmsInMonitoramentoRelations = relations(rawFirmsInMonitoramento, ({one}) => ({
	regioesInMonitoramento: one(regioesInMonitoramento, {
		fields: [rawFirmsInMonitoramento.regiaoId],
		references: [regioesInMonitoramento.id]
	}),
}));