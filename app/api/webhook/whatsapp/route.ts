import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { enviarMensagem, baixarImagemBase64 } from "@/lib/whatsapp";
import { extrairNota } from "@/lib/anthropic";

export const maxDuration = 60;

// GET — Meta verifica o webhook ao configurar
export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  if (
    p.get("hub.mode") === "subscribe" &&
    p.get("hub.verify_token") === process.env.WHATSAPP_VERIFY_TOKEN
  ) {
    return new NextResponse(p.get("hub.challenge"), { status: 200 });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

// POST — recebe mensagens enviadas pelo usuário
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ status: "ok" });
  }

  await processarWebhook(body);
  return NextResponse.json({ status: "ok" });
}

async function processarWebhook(body: unknown) {
  try {
    const entry = (body as any)?.entry?.[0];
    const msg = entry?.changes?.[0]?.value?.messages?.[0];
    if (!msg) return;

    const de = String(msg.from ?? "");

    if (msg.type === "image") {
      await processarImagem(de, msg.image?.id);
    } else if (msg.type === "text") {
      await processarTexto(de, String(msg.text?.body ?? ""));
    }
  } catch (err) {
    console.error("Webhook WhatsApp erro:", err);
  }
}

async function processarImagem(de: string, mediaId: string) {
  const estab = await prisma.estabelecimento.findFirst({
    where: { whatsappTelefone: de },
  });

  if (!estab) {
    await enviarMensagem(
      de,
      "❌ Número não vinculado a nenhuma conta.\n\nAcesse *caixafood.vercel.app/configuracoes* e cadastre seu WhatsApp para usar este recurso."
    );
    return;
  }

  await enviarMensagem(de, "🤖 Lendo sua nota fiscal...");

  try {
    const { base64, mimeType } = await baixarImagemBase64(mediaId);

    const categorias = await prisma.categoria.findMany({
      where: { estabelecimentoId: estab.id, tipo: "SAIDA" },
      select: { id: true, nome: true },
      orderBy: { nome: "asc" },
    });

    const dados = await extrairNota(
      base64,
      mimeType,
      categorias.map((c) => c.nome)
    );

    if (!dados.valorTotalReais || dados.valorTotalReais <= 0) {
      await enviarMensagem(
        de,
        "❌ Não consegui identificar o valor na nota.\nTente uma foto mais nítida e bem iluminada, ou registre manualmente no app."
      );
      return;
    }

    const valorCentavos = Math.round(dados.valorTotalReais * 100);
    const data = dados.dataEmissao
      ? new Date(dados.dataEmissao + "T12:00:00")
      : new Date();

    const catId = categorias.find((c) => c.nome === dados.categoriaSugerida)?.id ?? null;

    await prisma.lancamento.create({
      data: {
        tipo: "SAIDA",
        descricao: dados.fornecedor || "Compra via WhatsApp",
        valorCentavos,
        taxaDescontadaCentavos: 0,
        data,
        fornecedor: dados.fornecedor || null,
        origem: "WHATSAPP",
        status: "CONFIRMADO",
        estabelecimentoId: estab.id,
        categoriaId: catId,
      },
    });

    const valorFmt = (valorCentavos / 100).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
    });
    const dataFmt = data.toLocaleDateString("pt-BR");
    const catNome = dados.categoriaSugerida || "Sem categoria";

    await enviarMensagem(
      de,
      `✅ *Saída registrada!*\n\n` +
        `🏪 ${dados.fornecedor || "Compra"}\n` +
        `💰 R$ ${valorFmt}\n` +
        `📅 ${dataFmt}\n` +
        `🗂 ${catNome}\n\n` +
        `_Lançamento salvo no CaixaFood_`
    );
  } catch (err) {
    console.error("Erro ao processar imagem WhatsApp:", err);
    await enviarMensagem(
      de,
      "❌ Ocorreu um erro ao processar a nota.\nTente novamente ou registre manualmente no app."
    );
  }
}

async function processarTexto(de: string, texto: string) {
  const lower = texto.toLowerCase().trim();

  if (lower === "oi" || lower === "olá" || lower === "ola" || lower === "ajuda") {
    await enviarMensagem(
      de,
      "👋 *CaixaFood Bot*\n\n" +
        "📸 Envie uma *foto da nota fiscal* para registrar uma saída automaticamente.\n\n" +
        "Acesse *caixafood.vercel.app* para ver todos os lançamentos."
    );
  }
}
