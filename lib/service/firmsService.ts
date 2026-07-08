import { firmsRepository, findAllFirmsData } from "../repositories/firmsRepository";

// NOTA (migração multi-tenant): as classes FirmsFetcher/FirmsProcessor/
// FirmsNotifier e os jobs syncFirmsData/notifyFirms foram removidos — nunca
// rodaram em produção (sem vercel.json crons) e foram reconstruídos como
// Supabase Edge Functions (supabase/functions/firms-sync|firms-notify,
// ADR 0009). Este service atende só os indicadores do dashboard.

export async function getAllFirmsData() {
  const result = await findAllFirmsData();
  const rows = result.rows;

  const data: Record<number, number[]> = {};

  for (const row of rows) {
    const dateStr = row.acq_date as string; // "YYYY-MM-DD"
    if (!dateStr) continue;

    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = date.getMonth(); // 0-11

    if (!data[year]) {
      data[year] = Array(12).fill(0);
    }

    data[year][month]++;
  }

  return data;
}

export async function getFocosIndicador() {
  const today = new Date();
  const fmt = (d: Date) => d.toISOString().split("T")[0];

  // 1. Define ranges: Current (last 30 days) and Previous (30 days before that)
  const endCurrent = today;
  const startCurrent = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
  const startPrevious = new Date(startCurrent.getTime() - 30 * 24 * 60 * 60 * 1000);

  // 2. Fetch data
  const [currentFirms, previousFirms] = await Promise.all([
    firmsRepository.getFirmsDataByDateRange(fmt(startCurrent), fmt(endCurrent)),
    firmsRepository.getFirmsDataByDateRange(fmt(startPrevious), fmt(startCurrent)),
  ]);

  const current = currentFirms.length;
  const previous = previousFirms.length;

  // 3. Calculate deltaPct
  const deltaPct = previous > 0 ? ((current - previous) / previous) * 100 : null;

  // 4. Generate Sparkline (Daily counts for last 30 days)
  const sparkMap = new Map<string, number>();
  for (const f of currentFirms) {
    if (f.acqDate) {
      const key = f.acqDate; // acqDate is "YYYY-MM-DD"
      sparkMap.set(key, (sparkMap.get(key) ?? 0) + 1);
    }
  }

  const sparkline: number[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
    const key = fmt(d);
    sparkline.push(sparkMap.get(key) ?? 0);
  }

  return { current, previous, deltaPct, sparkline };
}
