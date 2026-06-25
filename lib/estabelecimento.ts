import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { exigirUsuario } from "@/lib/auth";

// cache() garante que esta função consulta o banco apenas uma vez por request,
// mesmo que layout, page e componentes a chamem separadamente.
export const getEstabelecimentoAtual = cache(async () => {
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
});
