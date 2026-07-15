// Supabase Edge Function: mapbiomas-notify (ADR 0011)
// Envia notificações de Detecções de Desmatamento pendentes, POR REGIÃO,
// via Resend. Pipeline genérico em _shared/notify.ts; aqui só a query de
// pendentes, a preferência ('desmatamento'), o template e o mark-sent.
//
// Env (Supabase secrets):
//   SUPABASE_DB_URL   — connection string Postgres
//   RESEND_API_KEY    — chave da API Resend (domínio já verificado)
//   ALERT_FROM_EMAIL  — remetente, ex: "Alertas PRISMA <alertas@dominio.org>"
//   CRON_SECRET       — bearer token exigido no request (pg_cron envia)

import { serveCron } from "../_shared/edge.ts";
import { runNotifyByRegion, type PendingBase } from "../_shared/notify.ts";

interface PendingRow extends PendingBase {
  alertid: string | null;
  alertha: number | null;
  detectat: string | null;
  source: string | null;
  latitude: number | null;
  longitude: number | null;
}

function buildEmailHtml(regionName: string, alerts: PendingRow[]): string {
  const listItems = alerts.map((a) => {
    const area = a.alertha != null ? `${a.alertha.toFixed(2)} ha` : "não informada";
    return `
        <li style="margin-bottom: 10px; padding: 10px; border-bottom: 1px solid #eee;">
            <b>Alerta MapBiomas:</b> #${a.alertid ?? "—"}<br>
            <b>Área:</b> ${area}<br>
            <b>Detectado em:</b> ${a.detectat ?? "—"}<br>
            <b>Fonte:</b> ${a.source ?? "—"}<br>
            <a href="https://www.google.com/maps/search/?api=1&query=${a.latitude},${a.longitude}"
               style="color: #2e7d32; text-decoration: none; font-weight: bold;">
               Ver Localização no Mapa
            </a>
        </li>
    `;
  }).join("");

  return `
    <div style="font-family: Arial, sans-serif; color: #333;">
        <h2 style="color: #2e7d32;">Alerta de Monitoramento de Desmatamento</h2>
        <p>O sistema detectou <strong>${alerts.length} novas detecções de desmatamento</strong> na região de monitoramento: <strong>${regionName}</strong>.</p>
        <hr style="border: 0; border-top: 1px solid #ccc;">
        <ul style="list-style-type: none; padding: 0;">
            ${listItems}
        </ul>
        <p style="font-size: 12px; color: #777;">Fonte: MapBiomas Alerta. Este é um alerta automático gerado pelo sistema de monitoramento PRISMA.</p>
    </div>
  `;
}

serveCron("mapbiomas-notify", ["RESEND_API_KEY", "ALERT_FROM_EMAIL"], ({ sql, env }) =>
  runNotifyByRegion<PendingRow>(sql, env, {
    logPrefix: "mapbiomas-notify",
    emptyMessage: "No new deforestation alerts to notify",
    preferenceKey: "desmatamento",
    // Pendentes (índice parcial WHERE alerta_enviado = false).
    // Centroide via PostGIS para o link de mapa — desmatamento é polígono.
    fetchPending: (sql) => sql<PendingRow[]>`
      SELECT dr.id AS junction_id, dr.regiao_id, r.nome AS regiao_nome,
             d.alertid, d.alertha, d.detectat, d.source,
             ST_Y(ST_Centroid(d.geom)) AS latitude,
             ST_X(ST_Centroid(d.geom)) AS longitude
      FROM monitoramento.desmatamento_regioes dr
      JOIN monitoramento.desmatamento d ON d.id = dr.desmatamento_id
      JOIN monitoramento.regioes r ON r.id = dr.regiao_id
      WHERE dr.alerta_enviado = false
      ORDER BY dr.regiao_id, d.detectat
    `,
    subject: (regionName) => `🌳 ALERTA: Novas detecções de desmatamento em ${regionName}`,
    html: buildEmailHtml,
    markSent: async (sql, junctionIds) => {
      await sql`
        UPDATE monitoramento.desmatamento_regioes
        SET alerta_enviado = true, notified_at = now()
        WHERE id = ANY(${junctionIds}::uuid[])
      `;
    },
  }));
