// Supabase Edge Function: mapbiomas-notify (ADR 0011)
// Envia notificações de Detecções de Desmatamento pendentes, POR REGIÃO,
// via Resend. Standalone (Deno) — não importa nada do app Next.js.
//
// Pipeline (padrão firms-notify):
//   1. Busca links pendentes em desmatamento_regioes (alerta_enviado = false —
//      usa o índice parcial idx_desmatamento_regioes_pendentes)
//   2. Agrupa por região; busca destinatarios_alertas ativos com
//      preferencias.desmatamento = true
//   3. Um email por região (Resend)
//   4. Marca alerta_enviado = true SÓ nas linhas da junction notificadas —
//      a mesma detecção em outra região continua pendente até a região
//      dela ser notificada
//
// Env (Supabase secrets):
//   SUPABASE_DB_URL   — connection string Postgres
//   RESEND_API_KEY    — chave da API Resend (domínio já verificado)
//   ALERT_FROM_EMAIL  — remetente, ex: "Alertas PRISMA <alertas@dominio.org>"
//   CRON_SECRET       — bearer token exigido no request (pg_cron envia)

import postgres from "npm:postgres@3.4.5";

interface PendingRow {
  junction_id: string;
  regiao_id: number;
  regiao_nome: string;
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

async function sendEmail(apiKey: string, from: string, to: string[], subject: string, html: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to, subject, html }),
  });
  if (!res.ok) {
    throw new Error(`Resend failed (${res.status}): ${await res.text()}`);
  }
}

Deno.serve(async (req) => {
  const cronSecret = Deno.env.get("CRON_SECRET");
  if (cronSecret && req.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
  }

  const dbUrl = Deno.env.get("SUPABASE_DB_URL");
  const resendKey = Deno.env.get("RESEND_API_KEY");
  const fromEmail = Deno.env.get("ALERT_FROM_EMAIL");
  if (!dbUrl || !resendKey || !fromEmail) {
    return new Response(JSON.stringify({ error: "missing SUPABASE_DB_URL, RESEND_API_KEY or ALERT_FROM_EMAIL" }), { status: 500 });
  }

  const sql = postgres(dbUrl, { prepare: false });

  try {
    // 1. Pendentes (índice parcial WHERE alerta_enviado = false).
    //    Centroide via PostGIS para o link de mapa — desmatamento é polígono.
    const pending = await sql<PendingRow[]>`
      SELECT dr.id AS junction_id, dr.regiao_id, r.nome AS regiao_nome,
             d.alertid, d.alertha, d.detectat, d.source,
             ST_Y(ST_Centroid(d.geom)) AS latitude,
             ST_X(ST_Centroid(d.geom)) AS longitude
      FROM monitoramento.desmatamento_regioes dr
      JOIN monitoramento.desmatamento d ON d.id = dr.desmatamento_id
      JOIN monitoramento.regioes r ON r.id = dr.regiao_id
      WHERE dr.alerta_enviado = false
      ORDER BY dr.regiao_id, d.detectat
    `;

    if (pending.length === 0) {
      await sql.end();
      return new Response(JSON.stringify({ status: "success", message: "No new deforestation alerts to notify" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // 2. Agrupa por região
    const byRegion = new Map<number, PendingRow[]>();
    for (const row of pending) {
      const list = byRegion.get(row.regiao_id) ?? [];
      list.push(row);
      byRegion.set(row.regiao_id, list);
    }

    let notified = 0;
    const errors: string[] = [];

    for (const [regiaoId, alerts] of byRegion) {
      const recipients = await sql`
        SELECT email FROM monitoramento.destinatarios_alertas
        WHERE regiao_id = ${regiaoId}
          AND ativo = true
          AND (preferencias->>'desmatamento')::boolean = true
      `;
      const emails = recipients.map((r) => r.email as string);
      if (emails.length === 0) continue;

      const regionName = alerts[0].regiao_nome ?? `ID ${regiaoId}`;
      try {
        // 3. Um envio por região
        await sendEmail(
          resendKey,
          fromEmail,
          emails,
          `🌳 ALERTA: Novas detecções de desmatamento em ${regionName}`,
          buildEmailHtml(regionName, alerts),
        );

        // 4. Marca SÓ as linhas da junction desta região
        const junctionIds = alerts.map((a) => a.junction_id);
        await sql`
          UPDATE monitoramento.desmatamento_regioes
          SET alerta_enviado = true, notified_at = now()
          WHERE id = ANY(${junctionIds}::uuid[])
        `;
        notified += alerts.length;
      } catch (err) {
        // Falha em uma região não bloqueia as demais; linhas ficam pendentes
        // e serão retentadas no próximo ciclo.
        console.error(`mapbiomas-notify: falha na região ${regiaoId}`, err);
        errors.push(`regiao ${regiaoId}: ${String(err)}`);
      }
    }

    const body = { status: errors.length ? "partial" : "success", notified, errors };
    console.log("mapbiomas-notify done", body);
    return new Response(JSON.stringify(body), { headers: { "Content-Type": "application/json" } });
  } catch (err) {
    console.error("mapbiomas-notify error", err);
    return new Response(JSON.stringify({ status: "error", message: String(err) }), { status: 500 });
  } finally {
    await sql.end();
  }
});
