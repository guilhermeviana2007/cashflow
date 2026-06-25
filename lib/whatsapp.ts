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

export async function enviarMensagem(para: string, texto: string): Promise<void> {
  const res = await fetch(`${GRAPH}/${phoneId()}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: para,
      type: "text",
      text: { body: texto },
    }),
  });
  if (!res.ok) {
    console.error("WhatsApp enviarMensagem:", await res.text());
  }
}

export async function baixarImagemBase64(mediaId: string): Promise<{
  base64: string;
  mimeType: "image/jpeg" | "image/png" | "image/webp";
}> {
  // 1. Pega a URL temporária da mídia
  const infoRes = await fetch(`${GRAPH}/${mediaId}`, {
    headers: { Authorization: `Bearer ${token()}` },
  });
  if (!infoRes.ok) throw new Error(`Media info falhou: ${await infoRes.text()}`);
  const { url, mime_type } = await infoRes.json() as { url: string; mime_type: string };

  // 2. Baixa a imagem
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

// Normaliza número de telefone para o formato E.164 sem + (ex: 5511999999999)
export function normalizarTelefone(tel: string): string {
  const digits = tel.replace(/\D/g, "");
  if (digits.length <= 11 && !digits.startsWith("55")) return "55" + digits;
  return digits;
}
