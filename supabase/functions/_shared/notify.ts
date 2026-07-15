// Pipeline genérico de Notificação por Região (ADR 0009/0011).
// Era duplicado verbatim entre firms-notify e mapbiomas-notify:
//   pendentes → agrupa por região → destinatários ativos com a preferência →
//   um email por região (Resend) → marca alerta_enviado SÓ nas linhas da
//   junction notificadas (o mesmo item em outra região continua pendente).
// Falha em uma região não bloqueia as demais; as linhas ficam pendentes e
// são retentadas no próximo ciclo.

import type { Sql } from "./edge.ts";

export async function sendEmail(
  apiKey: string,
  from: string,
  to: string[],
  subject: string,
  html: string,
): Promise<void> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to, subject, html }),
  });
  if (!res.ok) {
    throw new Error(`Resend failed (${res.status}): ${await res.text()}`);
  }
}

export interface PendingBase {
  junction_id: string;
  regiao_id: number;
  regiao_nome: string | null;
}

export interface NotifyConfig<Row extends PendingBase> {
  logPrefix: string;
  /** Mensagem do corpo de sucesso quando não há pendências. */
  emptyMessage: string;
  /** Chave em destinatarios_alertas.preferencias (ex: 'fogo', 'desmatamento'). */
  preferenceKey: string;
  fetchPending(sql: Sql): Promise<Row[]>;
  subject(regionName: string): string;
  html(regionName: string, rows: Row[]): string;
  /** Marca alerta_enviado=true/notified_at nas linhas da junction desta região. */
  markSent(sql: Sql, junctionIds: string[]): Promise<void>;
}

export async function runNotifyByRegion<Row extends PendingBase>(
  sql: Sql,
  env: Record<string, string>,
  cfg: NotifyConfig<Row>,
): Promise<Record<string, unknown>> {
  const pending = await cfg.fetchPending(sql);

  if (pending.length === 0) {
    return { status: "success", message: cfg.emptyMessage };
  }

  const byRegion = new Map<number, Row[]>();
  for (const row of pending) {
    const list = byRegion.get(row.regiao_id) ?? [];
    list.push(row);
    byRegion.set(row.regiao_id, list);
  }

  let notified = 0;
  const errors: string[] = [];

  for (const [regiaoId, rows] of byRegion) {
    const recipients = await sql`
      SELECT email FROM monitoramento.destinatarios_alertas
      WHERE regiao_id = ${regiaoId}
        AND ativo = true
        AND (preferencias->>${cfg.preferenceKey})::boolean = true
    `;
    const emails = recipients.map((r) => r.email as string);
    if (emails.length === 0) continue;

    const regionName = rows[0].regiao_nome ?? `ID ${regiaoId}`;
    try {
      await sendEmail(
        env.RESEND_API_KEY,
        env.ALERT_FROM_EMAIL,
        emails,
        cfg.subject(regionName),
        cfg.html(regionName, rows),
      );
      await cfg.markSent(sql, rows.map((r) => r.junction_id));
      notified += rows.length;
    } catch (err) {
      console.error(`${cfg.logPrefix}: falha na região ${regiaoId}`, err);
      errors.push(`regiao ${regiaoId}: ${String(err)}`);
    }
  }

  return { status: errors.length ? "partial" : "success", notified, errors };
}
