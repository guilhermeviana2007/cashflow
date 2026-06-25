import Anthropic from "@anthropic-ai/sdk";

// Cliente da Anthropic. Lê a chave de ANTHROPIC_API_KEY no ambiente (.env).
// Mantido como singleton para não recriar a cada chamada.
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
  categoriaSugerida: string; // nome de uma das categorias passadas, ou ""
};

// Schema que a IA é obrigada a seguir (structured outputs).
const SCHEMA = {
  type: "object",
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
        "A categoria mais provável, escolhida EXATAMENTE entre as opções fornecidas no texto. Vazio se nenhuma encaixar.",
    },
  },
  required: ["fornecedor", "dataEmissao", "valorTotalReais", "itens", "categoriaSugerida"],
  additionalProperties: false,
} as const;

// Lê uma nota fiscal a partir da imagem (base64) e devolve os dados estruturados.
export async function extrairNota(
  imagemBase64: string,
  mediaType: "image/jpeg" | "image/png" | "image/webp",
  categoriasDisponiveis: string[]
): Promise<NotaExtraida> {
  const client = getClient();

  const listaCategorias = categoriasDisponiveis.map((c) => `- ${c}`).join("\n");

  const response = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 16000,
    thinking: { type: "adaptive" }, // melhora leitura de notas bagunçadas
    output_config: {
      format: { type: "json_schema", schema: SCHEMA },
    },
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
              "Esta é a foto de uma nota fiscal/cupom de uma compra de um estabelecimento de food-service " +
              "(hamburgueria, pizzaria, lanchonete, açaiteria). Extraia os dados da compra.\n\n" +
              "Para 'categoriaSugerida', escolha a opção que melhor descreve o tipo de gasto, " +
              "EXATAMENTE como escrita nesta lista (ou deixe vazio se nenhuma encaixar):\n" +
              listaCategorias +
              "\n\nSe um campo não estiver legível, use vazio (texto) ou 0 (número). " +
              "Valores sempre em reais com ponto decimal.",
          },
        ],
      },
    ],
  });

  // Com structured outputs, o bloco de texto final contém o JSON válido.
  const texto = response.content.find((b) => b.type === "text");
  if (!texto || texto.type !== "text") {
    throw new Error("RESPOSTA_VAZIA");
  }
  return JSON.parse(texto.text) as NotaExtraida;
}
