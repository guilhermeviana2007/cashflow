import { formatData } from "@/lib/format";

// Aviso de cobrança mostrado no topo do conteúdo para o cliente.
// PROXIMA  -> faixa amarela (vence em até 5 dias)
// VENCIDA  -> faixa vermelha, mais enfática (pagamento atrasado)
export function AvisoAssinatura({
  situacao,
  dias,
  proximoVencimento,
}: {
  situacao: "PROXIMA" | "VENCIDA";
  dias: number;
  proximoVencimento: Date;
}) {
  if (situacao === "VENCIDA") {
    const atraso = Math.abs(dias);
    return (
      <div className="mb-5 rounded-xl border-2 border-danger bg-danger/10 p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl leading-none">⚠️</span>
          <div className="flex-1">
            <p className="font-bold text-danger">
              Pagamento vencido há {atraso} {atraso === 1 ? "dia" : "dias"}
            </p>
            <p className="mt-1 text-sm text-foreground">
              Sua mensalidade venceu em <strong>{formatData(proximoVencimento)}</strong>.
              Regularize o quanto antes para evitar a <strong>suspensão da conta</strong> e a
              perda de acesso aos seus dados.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-5 rounded-xl border border-amber-500/50 bg-amber-500/10 p-4">
      <div className="flex items-start gap-3">
        <span className="text-2xl leading-none">🔔</span>
        <div className="flex-1">
          <p className="font-semibold text-amber-500">
            {dias === 0
              ? "Sua mensalidade vence hoje"
              : `Sua mensalidade vence em ${dias} ${dias === 1 ? "dia" : "dias"}`}
          </p>
          <p className="mt-1 text-sm text-foreground">
            Vencimento em <strong>{formatData(proximoVencimento)}</strong>. Mantenha o
            pagamento em dia para não perder o acesso ao sistema.
          </p>
        </div>
      </div>
    </div>
  );
}
