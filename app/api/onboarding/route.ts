import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { emailConfigurado, enviarEmail } from "@/lib/email";
import { cpfValido } from "@/lib/onboarding/validacao";

// API pública que recebe o onboarding preenchido no site do SEO Pro (outro
// domínio) e grava no banco — aparece no painel /admin/onboarding.
//
// As pendências chegam calculadas pelo formulário. O CashFlow guarda o que
// recebe: o motor de regras vive colado às etapas, lá no SEO Pro, e duplicá-lo
// aqui só criaria duas versões divergindo. As respostas cruas ficam sempre
// gravadas, então a fonte da verdade nunca se perde.

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

type Pendencia = { texto: string; responsavel: string; criticidade: string };

// Aceita só o formato esperado de pendência — o corpo vem de outro domínio.
function sanearPendencias(v: unknown): Pendencia[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((p): p is Record<string, unknown> => !!p && typeof p === "object")
    .map((p) => ({
      texto: str(p.texto),
      responsavel: str(p.responsavel),
      criticidade: str(p.criticidade),
    }))
    .filter((p) => p.texto);
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, mensagem: "Dados inválidos." },
      { status: 400, headers: CORS }
    );
  }

  const token = str(body.token);
  const submissionId = str(body.submissionId);
  const respostas = (body.respostas ?? {}) as Record<string, Record<string, unknown>>;

  if (!token || !submissionId) {
    return NextResponse.json(
      { ok: false, mensagem: "Requisição inválida." },
      { status: 400, headers: CORS }
    );
  }

  // Autorização: o token é a credencial. Checada aqui, junto da query.
  const convite = await prisma.conviteOnboarding.findUnique({
    where: { token },
    include: { resposta: true },
  });

  if (!convite) {
    return NextResponse.json({ ok: false, mensagem: "Link inválido." }, { status: 404, headers: CORS });
  }
  if (convite.expiraEm < new Date()) {
    return NextResponse.json(
      { ok: false, mensagem: "Este link expirou. Fale com a gente para receber um novo." },
      { status: 410, headers: CORS }
    );
  }

  // Idempotência: reenvio com o mesmo submissionId devolve o resultado anterior.
  if (convite.resposta) {
    if (convite.resposta.submissionId === submissionId) {
      return NextResponse.json(
        { ok: true, pendencias: convite.resposta.pendencias },
        { headers: CORS }
      );
    }
    return NextResponse.json(
      { ok: false, mensagem: "Este formulário já foi enviado." },
      { status: 409, headers: CORS }
    );
  }

  const aceite = respostas.revisao ?? {};
  const aceiteNome = str(aceite.aceiteNome);
  const aceiteCpf = str(aceite.aceiteCpf);
  const aceiteCargo = str(aceite.aceiteCargo);

  // Revalida o termo no servidor. O formulário é conveniência; esta é a checagem
  // que vale.
  if (!aceiteNome || !aceiteCargo || !cpfValido(aceiteCpf) || aceite.aceiteTermo !== true) {
    return NextResponse.json(
      { ok: false, mensagem: "Preencha e aceite o termo de veracidade para enviar." },
      { status: 422, headers: CORS }
    );
  }

  const pendencias = sanearPendencias(body.pendencias);
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

  try {
    await prisma.respostaOnboarding.create({
      data: {
        conviteId: convite.id,
        submissionId,
        respostas: respostas as object,
        pendencias: pendencias as object,
        aceiteNome,
        aceiteCpf,
        aceiteCargo,
        aceiteIp: ip,
      },
    });
  } catch (e) {
    console.error("Erro ao salvar onboarding (API):", e);
    return NextResponse.json(
      { ok: false, mensagem: "Erro ao enviar. Suas respostas continuam salvas — tente novamente." },
      { status: 500, headers: CORS }
    );
  }

  // E-mails são efeito colateral: se o Resend falhar, a resposta já está salva.
  await notificar(convite.nomeCliente, str(respostas.escopo?.emailPreenchedor), pendencias);

  return NextResponse.json({ ok: true, pendencias }, { headers: CORS });
}

async function notificar(nomeCliente: string, emailCliente: string, pendencias: Pendencia[]) {
  if (!emailConfigurado()) return;

  const linhas = pendencias.length
    ? pendencias
        .map(
          (p) =>
            `<li><strong>${p.criticidade === "bloqueante" ? "🔴 " : ""}${p.texto}</strong> — ${
              p.responsavel === "cliente" ? "com você" : "com nossa equipe"
            }</li>`
        )
        .join("")
    : "<li>Nenhuma pendência. 👏</li>";

  const equipe = process.env.ONBOARDING_EMAIL_EQUIPE;

  const envios: Promise<void>[] = [];
  if (emailCliente) {
    envios.push(
      enviarEmail(
        emailCliente,
        "Recebemos suas informações",
        `<p>Olá! Recebemos tudo. Abaixo, o que ficou em aberto:</p><ul>${linhas}</ul>`
      )
    );
  }
  if (equipe) {
    envios.push(
      enviarEmail(
        equipe,
        `Onboarding recebido — ${nomeCliente}`,
        `<p>Recebemos o formulário de onboarding de <strong>${nomeCliente}</strong>.</p><p><strong>Pendências:</strong></p><ul>${linhas}</ul>`
      )
    );
  }

  const r = await Promise.allSettled(envios);
  for (const item of r) {
    if (item.status === "rejected") console.error("E-mail de onboarding falhou:", item.reason);
  }
}
