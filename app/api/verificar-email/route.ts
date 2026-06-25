import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const ok = token ? await confirmar(token) : false;

  return new NextResponse(pagina(ok), {
    status: ok ? 200 : 400,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

async function confirmar(token: string): Promise<boolean> {
  const u = await prisma.usuario.findFirst({ where: { tokenVerificacao: token } });
  if (!u || !u.tokenVerificacaoExpira || u.tokenVerificacaoExpira < new Date()) {
    return false;
  }
  await prisma.usuario.update({
    where: { id: u.id },
    data: {
      emailRecuperacaoVerificado: true,
      tokenVerificacao: null,
      tokenVerificacaoExpira: null,
    },
  });
  return true;
}

function pagina(ok: boolean): string {
  const titulo = ok ? "✅ E-mail confirmado!" : "❌ Link inválido ou expirado";
  const texto = ok
    ? "Seu e-mail de recuperação foi confirmado com sucesso."
    : "Este link de confirmação não é mais válido. Gere um novo na tela de Segurança.";
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>CashFlux — Verificação de e-mail</title></head>
<body style="margin:0;font-family:Arial,sans-serif;background:#0e1311;color:#e7ece9;display:flex;min-height:100vh;align-items:center;justify-content:center">
  <div style="text-align:center;max-width:420px;padding:24px">
    <h1 style="color:#3ecf8e">CashFlux</h1>
    <h2>${titulo}</h2>
    <p style="color:#8b968f">${texto}</p>
    <a href="https://caixafood.vercel.app/minha-conta"
       style="display:inline-block;margin-top:16px;background:#3ecf8e;color:#06140d;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:bold">
      Voltar ao sistema
    </a>
  </div>
</body></html>`;
}
