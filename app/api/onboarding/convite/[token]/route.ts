import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// API pública consumida pelo site do SEO Pro (outro domínio): informa o escopo
// de um convite (plano + serviços) para o formulário montar as etapas certas.
// Nunca devolve dado sensível — só o necessário para renderizar o wizard.

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const convite = await prisma.conviteOnboarding.findUnique({
    where: { token },
    include: { resposta: { select: { id: true } } },
  });

  if (!convite) {
    return NextResponse.json({ ok: true, estado: "inexistente" }, { headers: CORS });
  }
  if (convite.resposta) {
    return NextResponse.json({ ok: true, estado: "respondido" }, { headers: CORS });
  }
  if (convite.expiraEm < new Date()) {
    return NextResponse.json({ ok: true, estado: "expirado" }, { headers: CORS });
  }

  return NextResponse.json(
    {
      ok: true,
      estado: "valido",
      plano: convite.plano,
      servicos: convite.servicos,
      nomeCliente: convite.nomeCliente,
      emailCliente: convite.emailCliente,
    },
    { headers: CORS }
  );
}
