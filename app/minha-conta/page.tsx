import { cookies } from "next/headers";
import { exigirUsuario } from "@/lib/auth";
import { getEstabelecimentoAtual } from "@/lib/estabelecimento";
import {
  garantirAssinatura,
  calcularSituacao,
  rotuloPlano,
  type Situacao,
} from "@/lib/assinatura";
import { formatBRL, formatData } from "@/lib/format";
import { MinhaConta } from "./MinhaConta";

function situacaoDisplay(situacao: Situacao, dias: number) {
  switch (situacao) {
    case "PROXIMA":
      return {
        label: dias === 0 ? "Vence hoje" : `Vence em ${dias} dias`,
        cls: "bg-amber-500/15 text-amber-500",
      };
    case "VENCIDA":
      return {
        label: `Vencida há ${Math.abs(dias)} dias`,
        cls: "bg-danger/15 text-danger",
      };
    case "PAUSADA":
      return { label: "Pausada", cls: "bg-danger/15 text-danger" };
    case "CANCELADA":
      return { label: "Cancelada", cls: "bg-muted/20 text-muted" };
    default:
      return { label: "Em dia", cls: "bg-primary/15 text-primary" };
  }
}

export default async function MinhaContaPage() {
  const usuario = await exigirUsuario();
  const estab = await getEstabelecimentoAtual();
  const assinatura = await garantirAssinatura(usuario.id);
  const { situacao, dias } = calcularSituacao(assinatura);
  const sit = situacaoDisplay(situacao, dias);

  const tema =
    (await cookies()).get("caixafood_tema")?.value === "claro" ? "claro" : "escuro";

  return (
    <MinhaConta
      nome={estab.nome}
      fotoPerfil={estab.fotoPerfil}
      email={usuario.email}
      telefone={usuario.telefone ?? ""}
      emailRecuperacao={usuario.emailRecuperacao ?? ""}
      emailVerificado={usuario.emailRecuperacaoVerificado}
      temaInicial={tema}
      assinatura={{
        planoLabel: rotuloPlano(assinatura.plano),
        valorFmt:
          assinatura.valorCentavos > 0 ? formatBRL(assinatura.valorCentavos) : "A definir",
        vencimentoFmt: formatData(assinatura.proximoVencimento),
        situacaoLabel: sit.label,
        situacaoCls: sit.cls,
        ativa: assinatura.status === "ATIVA",
      }}
    />
  );
}
