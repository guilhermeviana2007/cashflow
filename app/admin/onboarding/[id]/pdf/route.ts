import { prisma } from "@/lib/prisma";
import { exigirAdmin } from "@/lib/auth";
import { formatData } from "@/lib/format";
import { gerarPdfOnboarding } from "@/lib/onboarding/gerarPdf";
import type { Pendencia } from "@/lib/onboarding/tipos";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await exigirAdmin();

  const { id } = await params;
  const convite = await prisma.conviteOnboarding.findUnique({
    where: { id },
    include: { resposta: true },
  });

  if (!convite || !convite.resposta) {
    return new Response("Onboarding não encontrado ou ainda sem resposta.", { status: 404 });
  }

  const r = convite.resposta;
  const pdf = await gerarPdfOnboarding({
    nomeCliente: convite.nomeCliente,
    emailCliente: convite.emailCliente,
    plano: convite.plano,
    servicos: convite.servicos,
    enviadoEm: formatData(r.createdAt),
    aceiteNome: r.aceiteNome,
    aceiteCargo: r.aceiteCargo,
    pendencias: r.pendencias as unknown as Pendencia[],
    respostas: r.respostas as Record<string, Record<string, unknown>>,
  });

  const nomeArquivo = `onboarding-${convite.nomeCliente.replace(/[^\p{L}\p{N}]+/gu, "-").toLowerCase()}.pdf`;

  return new Response(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${nomeArquivo}"`,
    },
  });
}
