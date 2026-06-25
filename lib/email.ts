import "server-only";

// Remetente. Configure EMAIL_FROM no Vercel quando tiver um domínio verificado
// no Resend (ex: "CashFlux <nao-responda@seudominio.com>"). Sem domínio próprio,
// o Resend só entrega para o e-mail dono da conta usando onboarding@resend.dev.
const FROM = process.env.EMAIL_FROM || "CashFlux <onboarding@resend.dev>";

// Envia um e-mail via API do Resend (sem dependência — usa fetch).
// Lança "EMAIL_NAO_CONFIGURADO" se a chave não estiver setada.
export async function enviarEmail(
  para: string,
  assunto: string,
  html: string
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("EMAIL_NAO_CONFIGURADO");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM, to: para, subject: assunto, html }),
  });

  if (!res.ok) {
    console.error("Resend falhou:", await res.text());
    throw new Error("EMAIL_FALHOU");
  }
}

export function emailConfigurado(): boolean {
  return !!process.env.RESEND_API_KEY;
}
