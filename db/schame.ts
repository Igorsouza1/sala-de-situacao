import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core"

export const bacia_rio_da_prata = pgTable("users", {
  id: serial("id").primaryKey(),
  geom: text("geom").notNull(),
})

export const shapes = pgTable("shapes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  coordinates: text("coordinates").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

