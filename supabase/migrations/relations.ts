import { relations } from "drizzle-orm/relations";
import { dossieTiposInRioDaPrata, dossieSubtiposInRioDaPrata, trilhasInRioDaPrata, waypointsInRioDaPrata, acoesInRioDaPrata, fotosAcoesInRioDaPrata, dossiesAmbientaisInRioDaPrata, dossiesUpdatesInRioDaPrata, dossiesMidiaInRioDaPrata, regioesInRioDaPrata } from "./schema";

export const dossieSubtiposInRioDaPrataRelations = relations(dossieSubtiposInRioDaPrata, ({one, many}) => ({
	dossieTiposInRioDaPrata: one(dossieTiposInRioDaPrata, {
		fields: [dossieSubtiposInRioDaPrata.tipoId],
		references: [dossieTiposInRioDaPrata.id]
	}),
	dossiesAmbientaisInRioDaPratas: many(dossiesAmbientaisInRioDaPrata),
}));

export const dossieTiposInRioDaPrataRelations = relations(dossieTiposInRioDaPrata, ({many}) => ({
	dossieSubtiposInRioDaPratas: many(dossieSubtiposInRioDaPrata),
	dossiesAmbientaisInRioDaPratas: many(dossiesAmbientaisInRioDaPrata),
}));

export const waypointsInRioDaPrataRelations = relations(waypointsInRioDaPrata, ({one}) => ({
	trilhasInRioDaPrata: one(trilhasInRioDaPrata, {
		fields: [waypointsInRioDaPrata.trilhaId],
		references: [trilhasInRioDaPrata.id]
	}),
}));

export const trilhasInRioDaPrataRelations = relations(trilhasInRioDaPrata, ({many}) => ({
	waypointsInRioDaPratas: many(waypointsInRioDaPrata),
	dossiesAmbientaisInRioDaPratas: many(dossiesAmbientaisInRioDaPrata),
}));

export const fotosAcoesInRioDaPrataRelations = relations(fotosAcoesInRioDaPrata, ({one}) => ({
	acoesInRioDaPrata: one(acoesInRioDaPrata, {
		fields: [fotosAcoesInRioDaPrata.acaoId],
		references: [acoesInRioDaPrata.id]
	}),
}));

export const acoesInRioDaPrataRelations = relations(acoesInRioDaPrata, ({many}) => ({
	fotosAcoesInRioDaPratas: many(fotosAcoesInRioDaPrata),
}));

export const dossiesUpdatesInRioDaPrataRelations = relations(dossiesUpdatesInRioDaPrata, ({one, many}) => ({
	dossiesAmbientaisInRioDaPrata: one(dossiesAmbientaisInRioDaPrata, {
		fields: [dossiesUpdatesInRioDaPrata.dossieId],
		references: [dossiesAmbientaisInRioDaPrata.id]
	}),
	dossiesMidiaInRioDaPratas: many(dossiesMidiaInRioDaPrata),
}));

export const dossiesAmbientaisInRioDaPrataRelations = relations(dossiesAmbientaisInRioDaPrata, ({one, many}) => ({
	dossiesUpdatesInRioDaPratas: many(dossiesUpdatesInRioDaPrata),
	regioesInRioDaPrata: one(regioesInRioDaPrata, {
		fields: [dossiesAmbientaisInRioDaPrata.regiaoId],
		references: [regioesInRioDaPrata.id]
	}),
	dossieSubtiposInRioDaPrata: one(dossieSubtiposInRioDaPrata, {
		fields: [dossiesAmbientaisInRioDaPrata.subtipoId],
		references: [dossieSubtiposInRioDaPrata.id]
	}),
	dossieTiposInRioDaPrata: one(dossieTiposInRioDaPrata, {
		fields: [dossiesAmbientaisInRioDaPrata.tipoId],
		references: [dossieTiposInRioDaPrata.id]
	}),
	trilhasInRioDaPrata: one(trilhasInRioDaPrata, {
		fields: [dossiesAmbientaisInRioDaPrata.trilhaId],
		references: [trilhasInRioDaPrata.id]
	}),
}));

export const dossiesMidiaInRioDaPrataRelations = relations(dossiesMidiaInRioDaPrata, ({one}) => ({
	dossiesUpdatesInRioDaPrata: one(dossiesUpdatesInRioDaPrata, {
		fields: [dossiesMidiaInRioDaPrata.updateId],
		references: [dossiesUpdatesInRioDaPrata.id]
	}),
}));

export const regioesInRioDaPrataRelations = relations(regioesInRioDaPrata, ({many}) => ({
	dossiesAmbientaisInRioDaPratas: many(dossiesAmbientaisInRioDaPrata),
}));