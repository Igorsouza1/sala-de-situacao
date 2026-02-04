import { firmsRepository } from "../repositories/firmsRepository";
import csv from "csv-parser";
import * as turf from "@turf/turf";
import { Readable } from "stream";
import { RawFirmInsert } from "../repositories/firmsRepository";

// --- FETCHER ---
class FirmsFetcher {
  private readonly MAP_KEY = process.env.NASA_FIRMS_MAP_KEY;
  private readonly BASE_URL = "https://firms.modaps.eosdis.nasa.gov/api/area/csv";

  async fetchTodaysData(): Promise<any[]> {
    if (!this.MAP_KEY) {
      throw new Error("NASA_FIRMS_MAP_KEY is not defined");
    }

    const today = new Date().toISOString().split("T")[0];
    // VIIRS_NOAA20_NRT, World, 1 day, Date
    const url = `${this.BASE_URL}/${this.MAP_KEY}/VIIRS_NOAA20_NRT/world/1/${today}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch FIRMS data: ${response.statusText}`);
    }

    const text = await response.text();
    const results: any[] = [];

    return new Promise((resolve, reject) => {
      Readable.from([text])
        .pipe(csv())
        .on("data", (data) => results.push(data))
        .on("end", () => resolve(results))
        .on("error", (err) => reject(err));
    });
  }
}

// --- PROCESSOR ---
class FirmsProcessor {
  isPointInRegion(latitude: number, longitude: number, regionGeom: any): boolean {
    if (!regionGeom || !regionGeom.coordinates) return false;

    // Handle different GeoJSON types if necessary, typically MultiPolygon for regions
    const point = turf.point([longitude, latitude]);

    try {
      // Ensure geometry is valid for Turf
      // Note: regionGeom from DB might need parsing if it's a string, 
      // but drizzle-orm/postgis usually returns distinct object structure. 
      // We assume regionGeom matches GeoJSON structure or is convertible.
      const geometry = typeof regionGeom === 'string' ? JSON.parse(regionGeom) : regionGeom;

      return turf.booleanPointInPolygon(point, geometry);
    } catch (error) {
      console.error("Error checking point in polygon:", error);
      return false;
    }
  }

  processCSVData(csvData: any[], regions: any[]): RawFirmInsert[] {
    const validFirms: RawFirmInsert[] = [];

    for (const row of csvData) {
      const lat = parseFloat(row.latitude);
      const lon = parseFloat(row.longitude);

      if (isNaN(lat) || isNaN(lon)) continue;

      for (const region of regions) {
        if (this.isPointInRegion(lat, lon, region.geom)) {
          validFirms.push({
            regiaoId: region.id,
            latitude: lat,
            longitude: lon,
            brightTi4: parseFloat(row.bright_ti4),
            scan: parseFloat(row.scan),
            track: parseFloat(row.track),
            acqDate: row.acq_date, // String YYYY-MM-DD
            acqTime: row.acq_time,
            satellite: row.satellite,
            instrument: row.instrument,
            confidence: row.confidence,
            version: row.version,
            brightTi5: parseFloat(row.bright_ti5),
            frp: parseFloat(row.frp),
            daynight: row.daynight,
            type: "0", // Default type if not present
            // geom: handled by PostGIS Trigger or manual construction if needed. 
            // Drizzle PostGIS usually wants a GeoJSON object or similar.
            // Constructing Point GeoJSON:
            geom: { type: "Point", coordinates: [lon, lat] } as any,
          });
          // A point belongs to one region? Or multiple? 
          // If strictly one, break. If overlaps allowed, continue.
          // Assuming one for simplicity, or add logic to handle multiple.
          break;
        }
      }
    }
    return validFirms;
  }
}

// --- NOTIFIER ---
class FirmsNotifier {
  private async getAccessToken(): Promise<string> {
    const tenantId = process.env.TENANT_ID;
    const clientId = process.env.CLIENT_ID;
    const clientSecret = process.env.CLIENT_SECRET;

    if (!tenantId || !clientId || !clientSecret) {
      throw new Error("Missing Microsoft Graph credentials (TENANT_ID, CLIENT_ID, CLIENT_SECRET)");
    }

    const params = new URLSearchParams();
    params.append("client_id", clientId);
    params.append("scope", "https://graph.microsoft.com/.default");
    params.append("client_secret", clientSecret);
    params.append("grant_type", "client_credentials");

    const response = await fetch(
      `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
      {
        method: "POST",
        body: params,
      }
    );

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Failed to get access token: ${err}`);
    }

    const data = await response.json();
    return data.access_token;
  }

  async sendEmail(to: string[], subject: string, bodyHtml: string) {
    if (to.length === 0) return;

    const token = await this.getAccessToken();
    const senderEmail = process.env.SENDER_EMAIL;

    if (!senderEmail) throw new Error("SENDER_EMAIL not defined");

    const message = {
      message: {
        subject: subject,
        body: {
          contentType: "HTML",
          content: bodyHtml,
        },
        toRecipients: to.map(email => ({
          emailAddress: {
            address: email,
          },
        })),
        from: {
          emailAddress: {
            address: senderEmail
          }
        }
      },
      saveToSentItems: "false",
    };

    const response = await fetch(
      `https://graph.microsoft.com/v1.0/users/${senderEmail}/sendMail`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(message),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      console.error("Error sending email:", err);
      // Don't throw to avoid stopping the whole process, just log
    }
  }
}

// --- ORCHESTRATOR ---
export const firmsFetcher = new FirmsFetcher();
export const firmsProcessor = new FirmsProcessor();
export const firmsNotifier = new FirmsNotifier();

export async function processFirmsData() {
  console.log("Starting FIRMS processing...");

  // 1. Fetch Data
  const csvData = await firmsFetcher.fetchTodaysData();
  console.log(`Fetched ${csvData.length} rows from NASA.`);

  // 2. Load Regions
  const regions = await firmsRepository.getActiveRegions();

  // 3. Process & Filter
  const validFirms = firmsProcessor.processCSVData(csvData, regions);
  console.log(`Found ${validFirms.length} fires in active regions.`);

  // 4. Bulk Insert (On Conflict Do Nothing)
  if (validFirms.length > 0) {
    await firmsRepository.bulkInsertFirms(validFirms);
  }

  // 5. Check for Unnotified Logic
  // Group fires by region to send bundled emails
  const unnotifiedFirms = await firmsRepository.getUnnotifiedFirms();

  if (unnotifiedFirms.length === 0) {
    console.log("No new fires to notify.");
    return { status: "success", message: "No new fires", processed: validFirms.length };
  }

  // Group by Regiao
  const firmsByRegion: Record<number, typeof unnotifiedFirms> = {};
  for (const firm of unnotifiedFirms) {
    if (!firm.regiaoId) continue;
    if (!firmsByRegion[firm.regiaoId]) {
      firmsByRegion[firm.regiaoId] = [];
    }
    firmsByRegion[firm.regiaoId].push(firm);
  }

  // 6. Notify & Mark as Sent
  for (const [regiaoIdStr, firms] of Object.entries(firmsByRegion)) {
    const regiaoId = parseInt(regiaoIdStr);
    const recipients = await firmsRepository.getRecipients(regiaoId);

    if (recipients.length === 0) {
      console.log(`No recipients for region ${regiaoId}`);
      continue;
    }

    // Filter by preference (example: simple check)
    const emailAddresses = recipients
      .filter(r => (r.preferencias as any)?.fogo === true)
      .map(r => r.email);

    if (emailAddresses.length === 0) continue;

    // Build Email Content
    const subject = `🔥 ALERTA DE INCÊNDIO: ${firms.length} novos focos detectados`;
    const listItems = firms.map(f => `
          <li>
              <b>Data/Hora:</b> ${f.acqDate} ${f.acqTime}<br>
              <b>Satélite:</b> ${f.satellite}<br>
              <b>Confiança:</b> ${f.confidence}<br>
              <b>Coords:</b> ${f.latitude}, ${f.longitude} <br>
              <a href="https://www.google.com/maps/search/?api=1&query=${f.latitude},${f.longitude}">Ver no Mapa</a>
          </li>
      `).join("");

    const htmlBody = `
          <h3>Novos focos de incêndio detectados na região (ID: ${regiaoId})</h3>
          <ul>${listItems}</ul>
          <p>Este é um alerta automático do sistema de monitoramento.</p>
      `;

    // Send Email
    await firmsNotifier.sendEmail(emailAddresses, subject, htmlBody);

    // Mark as notified
    const idsToMark = firms.map(f => f.id);
    await firmsRepository.markFirmsAsNotified(idsToMark);
  }

  return { status: "success", notified: unnotifiedFirms.length };
}
