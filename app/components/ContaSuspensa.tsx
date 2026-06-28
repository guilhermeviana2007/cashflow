import { sair } from "@/app/login/actions";

type Situacao = "PENDENTE" | "PAUSADA" | "CANCELADA" | "VENCIDA";

// Número de contratação/suporte (mesmo da landing de vendas).
const WHATSAPP_SUPORTE = "5531971354202";

const CONTEUDO: Record<Situacao, { icone: string; titulo: string; descricao: string; cta: string }> = {
  PENDENTE: {
    icone: "⏳",
    titulo: "Conta aguardando liberação",
    descricao:
      "Recebemos o seu cadastro! Para liberar o acesso, é só concluir a contratação com a gente pelo WhatsApp. Assim que o pagamento for confirmado, sua conta é ativada.",
    cta: "Concluir contratação no WhatsApp",
  },
  VENCIDA: {
    icone: "📅",
    titulo: "Mensalidade vencida",
    descricao:
      "Sua assinatura venceu e o acesso foi suspenso automaticamente. Regularize o pagamento com o suporte para retomar o uso do sistema.",
    cta: "Falar com o suporte",
  },
  PAUSADA: {
    icone: "🔒",
    titulo: "Conta suspensa",
    descricao:
      "Seu acesso está temporariamente suspenso. Regularize com o suporte para voltar a usar o sistema.",
    cta: "Falar com o suporte",
  },
  CANCELADA: {
    icone: "🔒",
    titulo: "Conta cancelada",
    descricao:
      "Sua assinatura foi cancelada. Seus dados estão guardados — fale com o suporte para reativar a conta.",
    cta: "Falar com o suporte",
  },
};

export function ContaSuspensa({
  email,
  situacao,
}: {
  email: string;
  situacao: Situacao;
}) {
  const { icone, titulo, descricao, cta } = CONTEUDO[situacao];

  const msg =
    situacao === "PENDENTE"
      ? `Olá! Acabei de me cadastrar no Cash Flow com a conta ${email} e quero concluir a contratação.`
      : `Olá! Sou responsável pela conta ${email} no Cash Flow e preciso regularizar o meu acesso.`;
  const waLink = `https://wa.me/${WHATSAPP_SUPORTE}?text=${encodeURIComponent(msg)}`;

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
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="btn block w-full rounded-lg bg-primary px-4 py-3 font-semibold text-primary-foreground hover:opacity-90 mb-3"
        >
          {cta}
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
