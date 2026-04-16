import { relations } from "drizzle-orm/relations";
import { regioesInMonitoramento, acoesInMonitoramento, tenantsInMonitoramento, trilhasInMonitoramento, userAccessInMonitoramento, usersInAuth, javaliAvistamentosInMonitoramento, fotosAcoesInMonitoramento, dequeDePedrasInMonitoramento, ponteDoCureInMonitoramento, rolesInMonitoramento, layerCatalogInMonitoramento, layerFeaturesInMonitoramento, featureObservationsInMonitoramento, waypointsInMonitoramento, desmatamentoInMonitoramento, propriedadesInMonitoramento, estradasInMonitoramento, rawFirmsInMonitoramento, layerDataInMonitoramento, balnearioMunicipalInMonitoramento } from "./schema";

export const acoesInMonitoramentoRelations = relations(acoesInMonitoramento, ({one, many}) => ({
	regioesInMonitoramento: one(regioesInMonitoramento, {
		fields: [acoesInMonitoramento.regiaoId],
		references: [regioesInMonitoramento.id]
	}),
	tenantsInMonitoramento: one(tenantsInMonitoramento, {
		fields: [acoesInMonitoramento.tenantId],
		references: [tenantsInMonitoramento.id]
	}),
	fotosAcoesInMonitoramentos: many(fotosAcoesInMonitoramento),
}));

export const regioesInMonitoramentoRelations = relations(regioesInMonitoramento, ({one, many}) => ({
	acoesInMonitoramentos: many(acoesInMonitoramento),
	trilhasInMonitoramentos: many(trilhasInMonitoramento),
	userAccessInMonitoramentos: many(userAccessInMonitoramento),
	tenantsInMonitoramento: one(tenantsInMonitoramento, {
		fields: [regioesInMonitoramento.organizationId],
		references: [tenantsInMonitoramento.id]
	}),
	rolesInMonitoramentos: many(rolesInMonitoramento),
	waypointsInMonitoramentos: many(waypointsInMonitoramento),
	desmatamentoInMonitoramentos: many(desmatamentoInMonitoramento),
	propriedadesInMonitoramentos: many(propriedadesInMonitoramento),
	estradasInMonitoramentos: many(estradasInMonitoramento),
	rawFirmsInMonitoramentos: many(rawFirmsInMonitoramento),
	layerCatalogInMonitoramentos: many(layerCatalogInMonitoramento),
}));

export const tenantsInMonitoramentoRelations = relations(tenantsInMonitoramento, ({many}) => ({
	acoesInMonitoramentos: many(acoesInMonitoramento),
	trilhasInMonitoramentos: many(trilhasInMonitoramento),
	userAccessInMonitoramentos: many(userAccessInMonitoramento),
	javaliAvistamentosInMonitoramentos: many(javaliAvistamentosInMonitoramento),
	dequeDePedrasInMonitoramentos: many(dequeDePedrasInMonitoramento),
	ponteDoCureInMonitoramentos: many(ponteDoCureInMonitoramento),
	regioesInMonitoramentos: many(regioesInMonitoramento),
	rolesInMonitoramentos: many(rolesInMonitoramento),
	waypointsInMonitoramentos: many(waypointsInMonitoramento),
	desmatamentoInMonitoramentos: many(desmatamentoInMonitoramento),
	propriedadesInMonitoramentos: many(propriedadesInMonitoramento),
	estradasInMonitoramentos: many(estradasInMonitoramento),
	rawFirmsInMonitoramentos: many(rawFirmsInMonitoramento),
	layerCatalogInMonitoramentos: many(layerCatalogInMonitoramento),
	layerDataInMonitoramentos: many(layerDataInMonitoramento),
	balnearioMunicipalInMonitoramentos: many(balnearioMunicipalInMonitoramento),
}));

export const trilhasInMonitoramentoRelations = relations(trilhasInMonitoramento, ({one, many}) => ({
	regioesInMonitoramento: one(regioesInMonitoramento, {
		fields: [trilhasInMonitoramento.regiaoId],
		references: [regioesInMonitoramento.id]
	}),
	tenantsInMonitoramento: one(tenantsInMonitoramento, {
		fields: [trilhasInMonitoramento.tenantId],
		references: [tenantsInMonitoramento.id]
	}),
	waypointsInMonitoramentos: many(waypointsInMonitoramento),
}));

export const userAccessInMonitoramentoRelations = relations(userAccessInMonitoramento, ({one}) => ({
	tenantsInMonitoramento: one(tenantsInMonitoramento, {
		fields: [userAccessInMonitoramento.organizationId],
		references: [tenantsInMonitoramento.id]
	}),
	regioesInMonitoramento: one(regioesInMonitoramento, {
		fields: [userAccessInMonitoramento.regiaoId],
		references: [regioesInMonitoramento.id]
	}),
	usersInAuth: one(usersInAuth, {
		fields: [userAccessInMonitoramento.userId],
		references: [usersInAuth.id]
	}),
}));

export const usersInAuthRelations = relations(usersInAuth, ({many}) => ({
	userAccessInMonitoramentos: many(userAccessInMonitoramento),
}));

export const javaliAvistamentosInMonitoramentoRelations = relations(javaliAvistamentosInMonitoramento, ({one}) => ({
	tenantsInMonitoramento: one(tenantsInMonitoramento, {
		fields: [javaliAvistamentosInMonitoramento.tenantId],
		references: [tenantsInMonitoramento.id]
	}),
}));

export const fotosAcoesInMonitoramentoRelations = relations(fotosAcoesInMonitoramento, ({one}) => ({
	acoesInMonitoramento: one(acoesInMonitoramento, {
		fields: [fotosAcoesInMonitoramento.acaoId],
		references: [acoesInMonitoramento.id]
	}),
}));

export const dequeDePedrasInMonitoramentoRelations = relations(dequeDePedrasInMonitoramento, ({one}) => ({
	tenantsInMonitoramento: one(tenantsInMonitoramento, {
		fields: [dequeDePedrasInMonitoramento.tenantId],
		references: [tenantsInMonitoramento.id]
	}),
}));

export const ponteDoCureInMonitoramentoRelations = relations(ponteDoCureInMonitoramento, ({one}) => ({
	tenantsInMonitoramento: one(tenantsInMonitoramento, {
		fields: [ponteDoCureInMonitoramento.tenantId],
		references: [tenantsInMonitoramento.id]
	}),
}));

export const rolesInMonitoramentoRelations = relations(rolesInMonitoramento, ({one}) => ({
	regioesInMonitoramento: one(regioesInMonitoramento, {
		fields: [rolesInMonitoramento.regionId],
		references: [regioesInMonitoramento.id]
	}),
	tenantsInMonitoramento: one(tenantsInMonitoramento, {
		fields: [rolesInMonitoramento.tenantId],
		references: [tenantsInMonitoramento.id]
	}),
}));

export const layerFeaturesInMonitoramentoRelations = relations(layerFeaturesInMonitoramento, ({one, many}) => ({
	layerCatalogInMonitoramento: one(layerCatalogInMonitoramento, {
		fields: [layerFeaturesInMonitoramento.layerId],
		references: [layerCatalogInMonitoramento.id]
	}),
	featureObservationsInMonitoramentos: many(featureObservationsInMonitoramento),
}));

export const layerCatalogInMonitoramentoRelations = relations(layerCatalogInMonitoramento, ({one, many}) => ({
	layerFeaturesInMonitoramentos: many(layerFeaturesInMonitoramento),
	regioesInMonitoramento: one(regioesInMonitoramento, {
		fields: [layerCatalogInMonitoramento.regiaoId],
		references: [regioesInMonitoramento.id]
	}),
	tenantsInMonitoramento: one(tenantsInMonitoramento, {
		fields: [layerCatalogInMonitoramento.tenantId],
		references: [tenantsInMonitoramento.id]
	}),
	layerDataInMonitoramentos: many(layerDataInMonitoramento),
}));

export const featureObservationsInMonitoramentoRelations = relations(featureObservationsInMonitoramento, ({one}) => ({
	layerFeaturesInMonitoramento: one(layerFeaturesInMonitoramento, {
		fields: [featureObservationsInMonitoramento.featureId],
		references: [layerFeaturesInMonitoramento.id]
	}),
}));

export const waypointsInMonitoramentoRelations = relations(waypointsInMonitoramento, ({one}) => ({
	regioesInMonitoramento: one(regioesInMonitoramento, {
		fields: [waypointsInMonitoramento.regiaoId],
		references: [regioesInMonitoramento.id]
	}),
	tenantsInMonitoramento: one(tenantsInMonitoramento, {
		fields: [waypointsInMonitoramento.tenantId],
		references: [tenantsInMonitoramento.id]
	}),
	trilhasInMonitoramento: one(trilhasInMonitoramento, {
		fields: [waypointsInMonitoramento.trilhaId],
		references: [trilhasInMonitoramento.id]
	}),
}));

export const desmatamentoInMonitoramentoRelations = relations(desmatamentoInMonitoramento, ({one}) => ({
	regioesInMonitoramento: one(regioesInMonitoramento, {
		fields: [desmatamentoInMonitoramento.regiaoId],
		references: [regioesInMonitoramento.id]
	}),
	tenantsInMonitoramento: one(tenantsInMonitoramento, {
		fields: [desmatamentoInMonitoramento.tenantId],
		references: [tenantsInMonitoramento.id]
	}),
}));

export const propriedadesInMonitoramentoRelations = relations(propriedadesInMonitoramento, ({one}) => ({
	regioesInMonitoramento: one(regioesInMonitoramento, {
		fields: [propriedadesInMonitoramento.regiaoId],
		references: [regioesInMonitoramento.id]
	}),
	tenantsInMonitoramento: one(tenantsInMonitoramento, {
		fields: [propriedadesInMonitoramento.tenantId],
		references: [tenantsInMonitoramento.id]
	}),
}));

export const estradasInMonitoramentoRelations = relations(estradasInMonitoramento, ({one}) => ({
	regioesInMonitoramento: one(regioesInMonitoramento, {
		fields: [estradasInMonitoramento.regiaoId],
		references: [regioesInMonitoramento.id]
	}),
	tenantsInMonitoramento: one(tenantsInMonitoramento, {
		fields: [estradasInMonitoramento.tenantId],
		references: [tenantsInMonitoramento.id]
	}),
}));

export const rawFirmsInMonitoramentoRelations = relations(rawFirmsInMonitoramento, ({one}) => ({
	regioesInMonitoramento: one(regioesInMonitoramento, {
		fields: [rawFirmsInMonitoramento.regiaoId],
		references: [regioesInMonitoramento.id]
	}),
	tenantsInMonitoramento: one(tenantsInMonitoramento, {
		fields: [rawFirmsInMonitoramento.tenantId],
		references: [tenantsInMonitoramento.id]
	}),
}));

export const layerDataInMonitoramentoRelations = relations(layerDataInMonitoramento, ({one}) => ({
	layerCatalogInMonitoramento: one(layerCatalogInMonitoramento, {
		fields: [layerDataInMonitoramento.layerId],
		references: [layerCatalogInMonitoramento.id]
	}),
	tenantsInMonitoramento: one(tenantsInMonitoramento, {
		fields: [layerDataInMonitoramento.tenantId],
		references: [tenantsInMonitoramento.id]
	}),
}));

export const balnearioMunicipalInMonitoramentoRelations = relations(balnearioMunicipalInMonitoramento, ({one}) => ({
	tenantsInMonitoramento: one(tenantsInMonitoramento, {
		fields: [balnearioMunicipalInMonitoramento.tenantId],
		references: [tenantsInMonitoramento.id]
	}),
}));