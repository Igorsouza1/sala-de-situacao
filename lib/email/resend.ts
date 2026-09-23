// Cliente mínimo para a API HTTP do Resend (mesmo padrão usado na Edge
// Function supabase/functions/firms-notify/index.ts, adaptado para rodar
// dentro do Next.js server-side).
//
// Env necessárias:
//   RESEND_API_KEY   — chave da API Resend
//   RESEND_FROM_EMAIL — remetente já verificado no Resend,
//                       ex: "Prisma Ambiental <alerta@prismageo.app>"

interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailInput): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    throw new Error("RESEND_API_KEY e RESEND_FROM_EMAIL são obrigatórios para enviar email.");
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, html }),
  });

  if (!res.ok) {
    throw new Error(`Resend falhou (${res.status}): ${await res.text()}`);
  }
}

const ROLE_LABELS: Record<string, string> = {
  owner: "Owner (controle total da organização)",
  editor: "Editor (cria e edita ações, sobe dados de campo)",
  viewer: "Viewer (somente visualização)",
  auditor: "Auditor (visualização + histórico de auditoria)",
};

function emailShell(title: string, bodyHtml: string): string {
  return `
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #1e293b;">
    <h1 style="font-size: 20px; font-weight: 700; margin: 0 0 16px;">${title}</h1>
    ${bodyHtml}
    <p style="font-size: 12px; color: #94a3b8; margin-top: 32px;">Prisma — inteligência geoespacial e monitoramento ambiental.</p>
  </div>`;
}

export function buildInviteEmail(input: {
  organizationName: string;
  role: string;
  regionNames: string[];
  actionLink: string;
}): { subject: string; html: string } {
  const roleLabel = ROLE_LABELS[input.role] ?? input.role;
  const regionsLine = input.regionNames.length
    ? `<p style="font-size: 14px; line-height: 1.6;"><strong>Regiões:</strong> ${input.regionNames.join(", ")}</p>`
    : `<p style="font-size: 14px; line-height: 1.6;"><strong>Regiões:</strong> acesso a toda a organização</p>`;

  const html = emailShell("Você foi convidado para o Prisma", `
    <p style="font-size: 14px; line-height: 1.6;">
      Você recebeu acesso à organização <strong>${input.organizationName}</strong> no Prisma.
    </p>
    <p style="font-size: 14px; line-height: 1.6;"><strong>Papel:</strong> ${roleLabel}</p>
    ${regionsLine}
    <a href="${input.actionLink}"
       style="display:inline-block; margin-top: 20px; padding: 12px 24px; background:#2563eb; color:#fff; text-decoration:none; border-radius:10px; font-weight:600; font-size:14px;">
      Ativar minha conta
    </a>
    <p style="font-size: 12px; color: #94a3b8; margin-top: 16px;">
      Clique no botão acima, defina sua senha e pronto — você já entra direto no seu painel.
    </p>
  `);

  return { subject: `Convite — acesso ao Prisma (${input.organizationName})`, html };
}

export function buildAccessGrantedEmail(input: {
  organizationName: string;
  role: string;
  regionNames: string[];
  signInLink: string;
}): { subject: string; html: string } {
  const roleLabel = ROLE_LABELS[input.role] ?? input.role;
  const regionsLine = input.regionNames.length
    ? `<p style="font-size: 14px; line-height: 1.6;"><strong>Regiões:</strong> ${input.regionNames.join(", ")}</p>`
    : `<p style="font-size: 14px; line-height: 1.6;"><strong>Regiões:</strong> acesso a toda a organização</p>`;

  const html = emailShell("Novo acesso liberado no Prisma", `
    <p style="font-size: 14px; line-height: 1.6;">
      Sua conta já existe no Prisma e agora tem acesso à organização <strong>${input.organizationName}</strong>.
    </p>
    <p style="font-size: 14px; line-height: 1.6;"><strong>Papel:</strong> ${roleLabel}</p>
    ${regionsLine}
    <a href="${input.signInLink}"
       style="display:inline-block; margin-top: 20px; padding: 12px 24px; background:#2563eb; color:#fff; text-decoration:none; border-radius:10px; font-weight:600; font-size:14px;">
      Entrar no Prisma
    </a>
  `);

  return { subject: `Novo acesso liberado — ${input.organizationName}`, html };
}
