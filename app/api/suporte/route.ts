import Anthropic from "@anthropic-ai/sdk";
import { getUsuarioAtual } from "@/lib/auth";

const SYSTEM_PROMPT = `Você é o assistente de suporte do Cash Flow, um sistema de controle de caixa para donos de food-service (hamburguerias, pizzarias, lanchonetes, açaiterias e similares).

O sistema possui as seguintes funcionalidades:
- **Dashboard**: gráficos de fluxo de caixa e distribuição de gastos por categoria
- **Lançamentos**: registrar entradas (vendas/receitas) e saídas (compras/despesas), com opção de editar ou excluir qualquer lançamento
- **Importar nota (IA)**: fotografar ou fazer upload de uma nota fiscal e a IA extrai automaticamente os dados
- **Taxas de pagamento**: configurar a porcentagem cobrada por cada forma de pagamento (cartão de crédito, débito, PIX, etc.)
- **Multi-estabelecimento**: cada usuário pode ter mais de um estabelecimento, cada um com seu próprio caixa
- **Login seguro**: sistema de autenticação com email e senha, sessão salva no navegador

Regras da conversa:
- Responda APENAS perguntas sobre o Cash Flow e seu uso
- Use linguagem simples e amigável, adequada para donos de pequenos negócios sem experiência técnica
- Se a pergunta não for sobre o sistema, explique gentilmente que você só pode ajudar com dúvidas do Cash Flow
- Seja objetivo e direto — respostas curtas quando possível`;

export async function POST(req: Request) {
  const usuario = await getUsuarioAtual();
  if (!usuario) {
    return new Response("Não autenticado", { status: 401 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ erro: "SEM_CHAVE" }, { status: 500 });
  }

  const { mensagens } = (await req.json()) as {
    mensagens: Array<{ role: "user" | "assistant"; content: string }>;
  };

  const client = new Anthropic();
  const encoder = new TextEncoder();

  const stream = client.messages.stream({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: mensagens,
  });

  const readable = new ReadableStream({
    async pull(controller) {
      for await (const chunk of stream) {
        if (
          chunk.type === "content_block_delta" &&
          chunk.delta.type === "text_delta"
        ) {
          controller.enqueue(encoder.encode(chunk.delta.text));
        }
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
