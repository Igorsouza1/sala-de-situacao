'use server'

import { db } from "@/db"
import { javaliAvistamentosInMonitoramento } from "@/db/schema"
import { sql } from "drizzle-orm"

export async function reportSighting(formData: FormData) {
  // Honeypot check for spam prevention
  const honeypot = formData.get("bot_field")
  if (honeypot) {
    // If honeypot is filled, act like it succeeded to fool bots
    console.warn("Spam attempt caught by honeypot.")
    return { success: true }
  }

  const tipo = formData.get("tipo")?.toString()
  const observacoes = formData.get("observacoes")?.toString()
  const latStr = formData.get("latitude")?.toString()
  const lngStr = formData.get("longitude")?.toString()

  if (!tipo || !latStr || !lngStr) {
    return { success: false, error: "Preencha todos os campos obrigatórios." }
  }

  const lat = parseFloat(latStr)
  const lng = parseFloat(lngStr)

  if (isNaN(lat) || isNaN(lng)) {
    return { success: false, error: "Coordenadas inválidas." }
  }

  try {
    await db.insert(javaliAvistamentosInMonitoramento).values({
      tipo: tipo,
      observacoes: observacoes,
      // Use PostGIS to create the point and set the SRID to 4674
      geom: sql`ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4674)`,
    })

    return { success: true }
  } catch (error) {
    console.error("Error saving sighting:", error)
    return { success: false, error: "Ocorreu um erro ao salvar o registro." }
  }
}
