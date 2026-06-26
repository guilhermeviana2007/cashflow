import { sair } from "@/app/login/actions";

type Situacao = "PAUSADA" | "CANCELADA" | "VENCIDA";

const CONTEUDO: Record<Situacao, { icone: string; titulo: string; descricao: string }> = {
  VENCIDA: {
    icone: "📅",
    titulo: "Mensalidade vencida",
    descricao:
      "Sua assinatura venceu e o acesso foi suspenso automaticamente. Regularize o pagamento com o suporte para retomar o uso do sistema.",
  },
  PAUSADA: {
    icone: "🔒",
    titulo: "Conta suspensa",
    descricao:
      "Seu acesso está temporariamente suspenso. Regularize com o suporte para voltar a usar o sistema.",
  },
  CANCELADA: {
    icone: "🔒",
    titulo: "Conta cancelada",
    descricao:
      "Sua assinatura foi cancelada. Seus dados estão guardados — fale com o suporte para reativar a conta.",
  },
};

export function ContaSuspensa({
  email,
  situacao,
}: {
  email: string;
  situacao: Situacao;
}) {
  const { icone, titulo, descricao } = CONTEUDO[situacao];

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md text-center">
        <div className="text-5xl mb-4">{icone}</div>
        <h1 className="text-2xl font-bold mb-2">{titulo}</h1>
        <p className="text-muted mb-6">{descricao}</p>

        <div className="rounded-xl border border-border bg-card p-4 mb-6 text-sm">
          <div className="text-muted">Conta</div>
          <div className="font-medium">{email}</div>
        </div>

        <a
          href="https://wa.me/"
          className="btn block w-full rounded-lg bg-primary px-4 py-3 font-semibold text-primary-foreground hover:opacity-90 mb-3"
        >
          Falar com o suporte
        </a>

        <form action={sair}>
          <button
            type="submit"
            className="w-full rounded-lg border border-border px-4 py-3 font-medium text-muted hover:bg-card"
          >
            Sair
          </button>
        </form>
      </div>
    </div>
  );
}
