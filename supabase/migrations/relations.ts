import { relations } from "drizzle-orm/relations";
import { trilhasInRioDaPrata, waypointsInRioDaPrata, acoesInRioDaPrata, fotosAcoesInRioDaPrata} from "./schema";

export const waypointsInRioDaPrataRelations = relations(waypointsInRioDaPrata, ({one}) => ({
	trilhasInRioDaPrata: one(trilhasInRioDaPrata, {
		fields: [waypointsInRioDaPrata.trilhaId],
		references: [trilhasInRioDaPrata.id]
	}),
}));

export const trilhasInRioDaPrataRelations = relations(trilhasInRioDaPrata, ({many}) => ({
	waypointsInRioDaPratas: many(waypointsInRioDaPrata),
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

