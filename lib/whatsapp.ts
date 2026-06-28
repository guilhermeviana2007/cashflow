const GRAPH = "https://graph.facebook.com/v19.0";

function token() {
  const t = process.env.WHATSAPP_TOKEN;
  if (!t) throw new Error("WHATSAPP_TOKEN não configurado");
  return t;
}

function phoneId() {
  const id = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!id) throw new Error("WHATSAPP_PHONE_NUMBER_ID não configurado");
  return id;
}

async function post(body: object): Promise<void> {
  const res = await fetch(`${GRAPH}/${phoneId()}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ messaging_product: "whatsapp", ...body }),
  });
  if (!res.ok) {
    console.error("WhatsApp API erro:", await res.text());
  }
}

export async function enviarMensagem(para: string, texto: string): Promise<void> {
  await post({ to: para, type: "text", text: { body: texto } });
}

export type BotaoResposta = { id: string; titulo: string };

export async function enviarBotoes(
  para: string,
  texto: string,
  botoes: BotaoResposta[]
): Promise<void> {
  await post({
    to: para,
    type: "interactive",
    interactive: {
      type: "button",
      body: { text: texto },
      action: {
        buttons: botoes.map((b) => ({
          type: "reply",
          reply: { id: b.id, title: b.titulo.slice(0, 20) },
        })),
      },
    },
  });
}

export type ItemLista = { id: string; titulo: string; descricao?: string };
export type SecaoLista = { titulo: string; itens: ItemLista[] };

export async function enviarLista(
  para: string,
  texto: string,
  botaoLabel: string,
  secoes: SecaoLista[]
): Promise<void> {
  await post({
    to: para,
    type: "interactive",
    interactive: {
      type: "list",
      body: { text: texto },
      action: {
        button: botaoLabel,
        sections: secoes.map((s) => ({
          title: s.titulo,
          rows: s.itens.map((i) => ({
            id: i.id,
            title: i.titulo.slice(0, 24),
            description: i.descricao?.slice(0, 72) ?? "",
          })),
        })),
      },
    },
  });
}

export async function baixarImagemBase64(mediaId: string): Promise<{
  base64: string;
  mimeType: "image/jpeg" | "image/png" | "image/webp";
}> {
  const infoRes = await fetch(`${GRAPH}/${mediaId}`, {
    headers: { Authorization: `Bearer ${token()}` },
  });
  if (!infoRes.ok) throw new Error(`Media info falhou: ${await infoRes.text()}`);
  const { url, mime_type } = (await infoRes.json()) as { url: string; mime_type: string };

  const imgRes = await fetch(url, {
    headers: { Authorization: `Bearer ${token()}` },
  });
  if (!imgRes.ok) throw new Error(`Download falhou: ${await imgRes.text()}`);

  const buffer = await imgRes.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");

  const tipos: Record<string, "image/jpeg" | "image/png" | "image/webp"> = {
    "image/jpeg": "image/jpeg",
    "image/jpg": "image/jpeg",
    "image/png": "image/png",
    "image/webp": "image/webp",
  };
  const mimeType = tipos[mime_type] ?? "image/jpeg";

  return { base64, mimeType };
}

export function normalizarTelefone(tel: string): string {
  const digits = tel.replace(/\D/g, "");
  if (digits.length <= 11 && !digits.startsWith("55")) return "55" + digits;
  return digits;
}
