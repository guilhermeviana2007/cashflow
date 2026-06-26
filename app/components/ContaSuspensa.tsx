import { sair } from "@/app/login/actions";

// Tela cheia exibida quando a assinatura do cliente está PAUSADA ou CANCELADA.
// Substitui todo o conteúdo do app — sem acesso até regularizar.
export function ContaSuspensa({
  email,
  cancelada,
}: {
  email: string;
  cancelada?: boolean;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md text-center">
        <div className="text-5xl mb-4">🔒</div>
        <h1 className="text-2xl font-bold mb-2">
          {cancelada ? "Conta cancelada" : "Conta suspensa"}
        </h1>
        <p className="text-muted mb-6">
          {cancelada
            ? "Sua assinatura foi cancelada. Seus dados estão guardados — fale com o suporte para reativar a conta."
            : "Seu acesso está temporariamente suspenso, geralmente por pagamento pendente. Regularize com o suporte para voltar a usar o sistema."}
        </p>

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
