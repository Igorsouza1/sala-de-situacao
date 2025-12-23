import { relations } from "drizzle-orm/relations";
import { acoesInRioDaPrata, fotosAcoesInRioDaPrata, regioesInRioDaPrata, trilhasInRioDaPrata, waypointsInRioDaPrata } from "./schema";

export const fotosAcoesInRioDaPrataRelations = relations(fotosAcoesInRioDaPrata, ({one}) => ({
	acoesInRioDaPrata: one(acoesInRioDaPrata, {
		fields: [fotosAcoesInRioDaPrata.acaoId],
		references: [acoesInRioDaPrata.id]
	}),
}));

export const acoesInRioDaPrataRelations = relations(acoesInRioDaPrata, ({one, many}) => ({
	fotosAcoesInRioDaPratas: many(fotosAcoesInRioDaPrata),
	regioesInRioDaPrata: one(regioesInRioDaPrata, {
		fields: [acoesInRioDaPrata.regiaoId],
		references: [regioesInRioDaPrata.id]
	}),
}));

export const regioesInRioDaPrataRelations = relations(regioesInRioDaPrata, ({many}) => ({
	acoesInRioDaPratas: many(acoesInRioDaPrata),
}));

export const waypointsInRioDaPrataRelations = relations(waypointsInRioDaPrata, ({one}) => ({
	trilhasInRioDaPrata: one(trilhasInRioDaPrata, {
		fields: [waypointsInRioDaPrata.trilhaId],
		references: [trilhasInRioDaPrata.id]
	}),
}));

export const trilhasInRioDaPrataRelations = relations(trilhasInRioDaPrata, ({many}) => ({
	waypointsInRioDaPratas: many(waypointsInRioDaPrata),
}));