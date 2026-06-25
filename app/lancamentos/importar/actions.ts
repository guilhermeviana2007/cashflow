"use server";

import { prisma } from "@/lib/prisma";
import { getEstabelecimentoAtual } from "@/lib/estabelecimento";
import { extrairNota, type NotaExtraida } from "@/lib/anthropic";

export type ResultadoExtracao =
  | { ok: true; dados: NotaExtraida }
  | { ok: false; erro: "SEM_CHAVE" | "FORMATO" | "ERRO"; mensagem: string };

const TIPOS_OK: Record<string, "image/jpeg" | "image/png" | "image/webp"> = {
  "image/jpeg": "image/jpeg",
  "image/jpg": "image/jpeg",
  "image/png": "image/png",
  "image/webp": "image/webp",
};

export async function extrairNotaDaImagem(
  formData: FormData
): Promise<ResultadoExtracao> {
  const arquivo = formData.get("imagem");
  if (!(arquivo instanceof File) || arquivo.size === 0) {
    return { ok: false, erro: "FORMATO", mensagem: "Selecione uma imagem da nota." };
  }

  const mediaType = TIPOS_OK[arquivo.type];
  if (!mediaType) {
    return {
      ok: false,
      erro: "FORMATO",
      mensagem: "Formato não suportado. Envie JPG, PNG ou WEBP.",
    };
  }

  const base64 = Buffer.from(await arquivo.arrayBuffer()).toString("base64");

  // Categorias de SAÍDA para a IA sugerir uma.
  const estab = await getEstabelecimentoAtual();
  const categorias = await prisma.categoria.findMany({
    where: { estabelecimentoId: estab.id, tipo: "SAIDA" },
    select: { nome: true },
    orderBy: { nome: "asc" },
  });

  try {
    const dados = await extrairNota(
      base64,
      mediaType,
      categorias.map((c) => c.nome)
    );
    return { ok: true, dados };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === "SEM_CHAVE") {
      return {
        ok: false,
        erro: "SEM_CHAVE",
        mensagem:
          "A chave da API da Anthropic não está configurada. Adicione ANTHROPIC_API_KEY no arquivo .env e reinicie o servidor.",
      };
    }
    return {
      ok: false,
      erro: "ERRO",
      mensagem: "Não consegui ler a nota. Tente uma foto mais nítida ou registre manualmente.",
    };
  }
}
