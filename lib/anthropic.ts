import Anthropic from "@anthropic-ai/sdk";

let _client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("SEM_CHAVE");
  }
  if (!_client) _client = new Anthropic();
  return _client;
}

export type ItemNota = { descricao: string; valorReais: number };

export type NotaExtraida = {
  fornecedor: string;
  dataEmissao: string; // "YYYY-MM-DD" ou "" se não encontrado
  valorTotalReais: number;
  itens: ItemNota[];
  categoriaSugerida: string;
};

const INPUT_SCHEMA = {
  type: "object" as const,
  properties: {
    fornecedor: {
      type: "string",
      description: "Nome do estabelecimento/fornecedor que emitiu a nota.",
    },
    dataEmissao: {
      type: "string",
      description: "Data de emissão no formato YYYY-MM-DD. Vazio se não localizar.",
    },
    valorTotalReais: {
      type: "number",
      description: "Valor TOTAL da nota em reais (ex.: 123.45).",
    },
    itens: {
      type: "array",
      description: "Itens comprados, se legíveis.",
      items: {
        type: "object",
        properties: {
          descricao: { type: "string" },
          valorReais: { type: "number" },
        },
        required: ["descricao", "valorReais"],
        additionalProperties: false,
      },
    },
    categoriaSugerida: {
      type: "string",
      description:
        "A categoria mais provável, escolhida EXATAMENTE entre as opções fornecidas. Vazio se nenhuma encaixar.",
    },
  },
  required: ["fornecedor", "dataEmissao", "valorTotalReais", "itens", "categoriaSugerida"],
  additionalProperties: false,
};

export async function extrairNota(
  imagemBase64: string,
  mediaType: "image/jpeg" | "image/png" | "image/webp",
  categoriasDisponiveis: string[]
): Promise<NotaExtraida> {
  const client = getClient();
  const listaCategorias = categoriasDisponiveis.map((c) => `- ${c}`).join("\n");

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    tools: [
      {
        name: "extrair_dados_nota",
        description: "Extrai dados estruturados de uma nota fiscal ou cupom.",
        input_schema: INPUT_SCHEMA,
      },
    ],
    tool_choice: { type: "tool", name: "extrair_dados_nota" },
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mediaType, data: imagemBase64 },
          },
          {
            type: "text",
            text:
              "Esta é a foto de uma nota fiscal/cupom de compra de um food-service. " +
              "Extraia os dados usando a ferramenta fornecida.\n\n" +
              "Para 'categoriaSugerida', escolha EXATAMENTE uma opção da lista abaixo (ou deixe vazio):\n" +
              listaCategorias +
              "\n\nSe um campo não estiver legível, use string vazia ou 0.",
          },
        ],
      },
    ],
  });

  const toolBlock = response.content.find((b) => b.type === "tool_use");
  if (!toolBlock || toolBlock.type !== "tool_use") {
    throw new Error("RESPOSTA_VAZIA");
  }

  return toolBlock.input as NotaExtraida;
}
