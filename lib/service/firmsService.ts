import { firmsRepository } from "../repositories/firmsRepository";
import csv from "csv-parser";
import * as turf from "@turf/turf";
import { Readable } from "stream";
import { RawFirmInsert } from "../repositories/firmsRepository";
import { sql } from "drizzle-orm";

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

// --- PROCESSOR (Layer 1: Region Filter) ---
class FirmsProcessor {
  // Optimization: Pre-calculate total bounding box of all regions to fail fast
  private calculateTotalBBox(regions: any[]) {
    if (regions.length === 0) return null;
    const features = regions.map(r => {
      try {
        return typeof r.geom === 'string' ? JSON.parse(r.geom) : r.geom;
      } catch { return null; }
    }).filter(g => g !== null).map(g => turf.feature(g));

    if (features.length === 0) return null;
    return turf.bbox(turf.featureCollection(features));
  }

  isPointInRegion(latitude: number, longitude: number, regionGeom: any): boolean {
    if (!regionGeom) return false;

    const point = turf.point([longitude, latitude]);

    try {
      const geometry = typeof regionGeom === 'string' ? JSON.parse(regionGeom) : regionGeom;
      return turf.booleanPointInPolygon(point, geometry);
    } catch (error) {
      console.error("Error checking point in polygon:", error);
      return false;
    }
  }

  processCSVData(csvData: any[], regions: any[]): RawFirmInsert[] {
    const validFirms: RawFirmInsert[] = [];
    const totalBBox = this.calculateTotalBBox(regions);

    // Parse geometries once to avoid repetitive parsing
    const parsedRegions = regions.map(r => ({
      ...r,
      parsedGeom: typeof r.geom === 'string' ? JSON.parse(r.geom) : r.geom
    }));

    for (const row of csvData) {
      const lat = parseFloat(row.latitude);
      const lon = parseFloat(row.longitude);

      if (isNaN(lat) || isNaN(lon)) continue;

      // 1. Fast Global BBOX Check
      // If we have a total bbox, check if point is inside it first
      if (totalBBox) {
        // turf.bbox returns [minX, minY, maxX, maxY] => [minLon, minLat, maxLon, maxLat]
        const [minLon, minLat, maxLon, maxLat] = totalBBox;
        if (lon < minLon || lon > maxLon || lat < minLat || lat > maxLat) {
          continue; // Skip points outside the general monitoring area
        }
      }

      // 2. Precise Polygon Check
      for (const region of parsedRegions) {
        // We pass the already parsed geometry to avoid re-parsing
        if (this.isPointInRegion(lat, lon, region.parsedGeom)) {
          validFirms.push({
            regiaoId: region.id,
            latitude: lat,
            longitude: lon,
            brightTi4: parseFloat(row.bright_ti4),
            scan: parseFloat(row.scan),
            track: parseFloat(row.track),
            acqDate: row.acq_date,
            acqTime: row.acq_time,
            satellite: row.satellite,
            instrument: row.instrument,
            confidence: row.confidence,
            version: row.version,
            brightTi5: parseFloat(row.bright_ti5),
            frp: parseFloat(row.frp),
            daynight: row.daynight,
            type: "0",
            geom: sql`ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4674)` as any,
          });
          break; // Point assigned to first matching region
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
      throw new Error("Missing Microsoft Graph credentials");
    }

    const params = new URLSearchParams();
    params.append("client_id", clientId);
    params.append("scope", "https://graph.microsoft.com/.default");
    params.append("client_secret", clientSecret);
    params.append("grant_type", "client_credentials");

    const response = await fetch(
      `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
      { method: "POST", body: params }
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
          emailAddress: { address: email },
        })),
        from: {
          emailAddress: { address: senderEmail }
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
    }
  }
}

// --- ORCHESTRATOR ---
export const firmsFetcher = new FirmsFetcher();
export const firmsProcessor = new FirmsProcessor();
export const firmsNotifier = new FirmsNotifier();

// Job 1: Sync (Fetch -> Filter -> Insert -> Enrich)
export async function syncFirmsData() {
  console.log("Starting FIRMS Sync...");

  // 1. Fetch Data
  const csvData = await firmsFetcher.fetchTodaysData();
  console.log(`Fetched ${csvData.length} rows from NASA.`);

  // 2. Load Regions
  const regions = await firmsRepository.getActiveRegions();

  // 3. Process & Filter (Layer 1 with BBOX Optimization)
  const validFirms = firmsProcessor.processCSVData(csvData, regions);
  console.log(`Found ${validFirms.length} fires in active regions.`);

  // 4. Bulk Insert
  if (validFirms.length > 0) {
    await firmsRepository.bulkInsertFirms(validFirms);
  }

  // 5. Enrichment (Layer 2)
  console.log("Enriching fires with CAR data...");
  await firmsRepository.enrichFirmsWithCAR();

  return { status: "success", inserted: validFirms.length };
}

// Job 2: Notify (Poll -> Email -> Mark Sent)
export async function notifyFirms() {
  console.log("Starting FIRMS Notification...");

  // 1. Check for Unnotified matches
  const unnotifiedFirms = await firmsRepository.getUnnotifiedFirms();

  if (unnotifiedFirms.length === 0) {
    console.log("No new fires to notify.");
    return { status: "success", message: "No new fires to notify" };
  }

  // 2. Load Region Names
  const regions = await firmsRepository.getActiveRegions();
  const regionMap = new Map(regions.map(r => [r.id, r.nome]));

  // 3. Group by Regiao
  const firmsByRegion: Record<number, typeof unnotifiedFirms> = {};
  for (const firm of unnotifiedFirms) {
    if (!firm.regiaoId) continue;
    if (!firmsByRegion[firm.regiaoId]) {
      firmsByRegion[firm.regiaoId] = [];
    }
    firmsByRegion[firm.regiaoId].push(firm);
  }

  // 4. Notify & Mark as Sent
  let notifiedCount = 0;
  for (const [regiaoIdStr, firms] of Object.entries(firmsByRegion)) {
    const regiaoId = parseInt(regiaoIdStr);
    const recipients = await firmsRepository.getRecipients(regiaoId);
    if (recipients.length === 0) continue;

    const emailAddresses = recipients
      .filter(r => (r.preferencias as any)?.fogo === true)
      .map(r => r.email);

    if (emailAddresses.length === 0) continue;

    const regionName = regionMap.get(regiaoId) || `ID ${regiaoId}`;

    // Build Professional Email Content
    const subject = `🔥 ALERTA: Novos focos em ${regionName}`;

    const listItems = firms.map(f => {
      const carInfo = f.codImovel ? `<b>CAR:</b> ${f.codImovel}<br>` : "<b>CAR:</b> Não identificado<br>";

      return `
          <li style="margin-bottom: 10px; padding: 10px; border-bottom: 1px solid #eee;">
              ${carInfo}
              <b>Data:</b> ${f.acqDate} às ${f.acqTime} UTC<br>
              <a href="https://www.google.com/maps/search/?api=1&query=${f.latitude},${f.longitude}" 
                 style="color: #d9534f; text-decoration: none; font-weight: bold;">
                 Ver Localização no Mapa
              </a>
          </li>
      `;
    }).join("");

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; color: #333;">
          <h2 style="color: #d9534f;">Alerta de Monitoramento de Incêndios</h2>
          <p>O sistema detectou <strong>${firms.length} novos focos</strong> na região de monitoramento: <strong>${regionName}</strong>.</p>
          <hr style="border: 0; border-top: 1px solid #ccc;">
          <ul style="list-style-type: none; padding: 0;">
              ${listItems}
          </ul>
          <p style="font-size: 12px; color: #777;">Este é um alerta automático gerado pelo sistema de monitoramento GeoMap.</p>
      </div>
    `;

    // Send Email
    await firmsNotifier.sendEmail(emailAddresses, subject, htmlBody);

    // Mark as notified
    const idsToMark = firms.map(f => f.id);
    await firmsRepository.markFirmsAsNotified(idsToMark);
    notifiedCount += firms.length;
  }

  return { status: "success", notified: notifiedCount };
}

// Deprecated: Kept for backward compatibility if needed temporarily
export async function processFirmsData() {
  await syncFirmsData();
  return await notifyFirms();
}
