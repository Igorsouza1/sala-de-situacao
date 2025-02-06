import { pgTable, serial, text, timestamp, doublePrecision, integer, date, geometry } from "drizzle-orm/pg-core"

export const shapes = pgTable("shapes", {
  id: serial("id").primaryKey(),
  geom: text("geom").notNull(),
})

export const deque_de_pedras = pgTable("deque_de_pedras", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  coordinates: text("coordinates").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})


export const acoes = pgTable("acoes", {
  id: serial("id").primaryKey(), 
  name: text("name").notNull(),
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  elevation: doublePrecision("elevation"), 
  time: timestamp("time", { withTimezone: false }).notNull(),
  descricao: text("descricao"),
  mes: text("mes"),
  atuacao: text("atuacao"),
  acao: text("acao"),
  geom: geometry('geom', { type: 'point', mode: 'xy', srid: 4326 }),
});


export const desmatamento = pgTable("desmatamento", {
  id: serial("id").primaryKey(), 
  geom: text("geom"), 
  detectat: timestamp("detectat", { withTimezone: false }), 
  detectyear: integer("detectyear"), 
  stateha: doublePrecision("stateha"),
  alertha: doublePrecision("alertha"), 
  alertid: text("alertid"), 
  alertcode: text("alertcode"), 
  state: text("state"), 
  source: text("source") 
});



export const fireDetections = pgTable("raw_firms", {
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  bright_ti4: doublePrecision("bright_ti4"),
  scan: doublePrecision("scan"),
  track: doublePrecision("track"),
  acq_date: date("acq_date"), 
  acq_time: integer("acq_time"), 
  bright_ti5: doublePrecision("bright_ti5"),
  frp: doublePrecision("frp"), 
  type: integer("type"),
  hora_deteccao: timestamp("hora_deteccao", { withTimezone: false }),
  geom: text("geom"), 
  satellite: text("satellite"),
  instrument: text("instrument"),
  confidence: text("confidence"), 
  version: text("version"),
  daynight: text("daynight") 
});



