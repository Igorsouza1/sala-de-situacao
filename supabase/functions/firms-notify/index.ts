// Supabase Edge Function: firms-notify (ADR 0009)
// Envia alertas de focos de calor pendentes, POR REGIÃO, via Resend.
// Pipeline genérico em _shared/notify.ts; aqui só a query de pendentes,
// a preferência ('fogo'), o template do email e o mark-sent da junction.
//
// Env (Supabase secrets):
//   SUPABASE_DB_URL   — connection string Postgres
//   RESEND_API_KEY    — chave da API Resend (domínio já verificado)
//   ALERT_FROM_EMAIL  — remetente, ex: "Alertas PRISMA <alertas@dominio.org>"
//   CRON_SECRET       — bearer token exigido no request (pg_cron envia)

import { serveCron } from "../_shared/edge.ts";
import { runNotifyByRegion, type PendingBase } from "../_shared/notify.ts";

interface PendingRow extends PendingBase {
  latitude: number | null;
  longitude: number | null;
  acq_date: string | null;
  acq_time: string | null;
  cod_imovel: string | null;
}

function buildEmailHtml(regionName: string, firms: PendingRow[]): string {
  const listItems = firms.map((f) => {
    const carInfo = f.cod_imovel
      ? `<b>CAR:</b> ${f.cod_imovel}<br>`
      : "<b>CAR:</b> Não identificado<br>";
    return `
        <li style="margin-bottom: 10px; padding: 10px; border-bottom: 1px solid #eee;">
            ${carInfo}
            <b>Data:</b> ${f.acq_date} às ${f.acq_time} UTC<br>
            <a href="https://www.google.com/maps/search/?api=1&query=${f.latitude},${f.longitude}"
               style="color: #d9534f; text-decoration: none; font-weight: bold;">
               Ver Localização no Mapa
            </a>
        </li>
    `;
  }).join("");

  return `
    <div style="font-family: Arial, sans-serif; color: #333;">
        <h2 style="color: #d9534f;">Alerta de Monitoramento de Incêndios</h2>
        <p>O sistema detectou <strong>${firms.length} novos focos</strong> na região de monitoramento: <strong>${regionName}</strong>.</p>
        <hr style="border: 0; border-top: 1px solid #ccc;">
        <ul style="list-style-type: none; padding: 0;">
            ${listItems}
        </ul>
        <p style="font-size: 12px; color: #777;">Este é um alerta automático gerado pelo sistema de monitoramento PRISMA.</p>
    </div>
  `;
}

serveCron("firms-notify", ["RESEND_API_KEY", "ALERT_FROM_EMAIL"], ({ sql, env }) =>
  runNotifyByRegion<PendingRow>(sql, env, {
    logPrefix: "firms-notify",
    emptyMessage: "No new fires to notify",
    preferenceKey: "fogo",
    // Pendentes (índice parcial WHERE alerta_enviado = false)
    fetchPending: (sql) => sql<PendingRow[]>`
      SELECT fr.id AS junction_id, fr.regiao_id, r.nome AS regiao_nome,
             rf.latitude, rf.longitude, rf.acq_date::text, rf.acq_time, rf.cod_imovel
      FROM monitoramento.firms_regioes fr
      JOIN monitoramento.raw_firms rf ON rf.id = fr.firm_id
      JOIN monitoramento.regioes r ON r.id = fr.regiao_id
      WHERE fr.alerta_enviado = false
      ORDER BY fr.regiao_id, rf.acq_date, rf.acq_time
    `,
    subject: (regionName) => `🔥 ALERTA: Novos focos em ${regionName}`,
    html: buildEmailHtml,
    markSent: async (sql, junctionIds) => {
      await sql`
        UPDATE monitoramento.firms_regioes
        SET alerta_enviado = true, notified_at = now()
        WHERE id = ANY(${junctionIds}::uuid[])
      `;
    },
  }));
