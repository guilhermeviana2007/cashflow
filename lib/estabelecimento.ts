import { prisma } from "@/lib/prisma";
import { exigirUsuario } from "@/lib/auth";

// Estabelecimento do usuário logado. Exige login (redireciona para /login se deslogado).
// MVP: um estabelecimento por usuário (o primeiro). Multi-estabelecimento por usuário
// fica para depois — o modelo já suporta.
export async function getEstabelecimentoAtual() {
  const usuario = await exigirUsuario();
  const estab = await prisma.estabelecimento.findFirst({
    where: { usuarioId: usuario.id },
    orderBy: { createdAt: "asc" },
  });
  if (!estab) {
    throw new Error(
      "Usuário sem estabelecimento. Isso não deveria acontecer — recadastre."
    );
  }
  return estab;
}
