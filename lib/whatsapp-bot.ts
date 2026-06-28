import { prisma } from "@/lib/prisma";
import {
  enviarMensagem,
  enviarBotoes,
  enviarLista,
} from "@/lib/whatsapp";

// ─── Tipos ───────────────────────────────────────────────────────────────────

type Estado =
  | "IDLE"
  | "ENTRADA_VALOR"
  | "ENTRADA_DESC"
  | "ENTRADA_CAT"
  | "SAIDA_VALOR"
  | "SAIDA_DESC"
  | "SAIDA_CAT"
  | "ESTOQUE_ATUALIZAR_PRODUTO"
  | "ESTOQUE_ATUALIZAR_QTDE";

interface DadosParciais {
  tipo?: "ENTRADA" | "SAIDA";
  valorCentavos?: number;
  descricao?: number;
  categorias?: { id: string; nome: string }[];
  produtoId?: string;
  produtoNome?: string;
}

// ─── Sessão ──────────────────────────────────────────────────────────────────

async function getEstado(telefone: string): Promise<{ estado: Estado; dados: DadosParciais }> {
  const sessao = await prisma.sessaoWhatsapp.findUnique({ where: { telefone } });
  return {
    estado: (sessao?.estado ?? "IDLE") as Estado,
    dados: sessao?.dados ? (JSON.parse(sessao.dados) as DadosParciais) : {},
  };
}

async function setEstado(telefone: string, estado: Estado, dados: DadosParciais = {}): Promise<void> {
  await prisma.sessaoWhatsapp.upsert({
    where: { telefone },
    create: { telefone, estado, dados: JSON.stringify(dados) },
    update: { estado, dados: JSON.stringify(dados) },
  });
}

async function resetEstado(telefone: string): Promise<void> {
  await setEstado(telefone, "IDLE", {});
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 });
}

function parseMoeda(texto: string): number | null {
  const limpo = texto.replace(/[^\d,\.]/g, "").replace(",", ".");
  const valor = parseFloat(limpo);
  if (isNaN(valor) || valor <= 0) return null;
  return Math.round(valor * 100);
}

function hoje(): { inicio: Date; fim: Date } {
  const now = new Date();
  const inicio = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const fim = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  return { inicio, fim };
}

function semana(): { inicio: Date; fim: Date } {
  const now = new Date();
  const dia = now.getDay();
  const inicio = new Date(now);
  inicio.setDate(now.getDate() - dia);
  inicio.setHours(0, 0, 0, 0);
  const fim = new Date(inicio);
  fim.setDate(inicio.getDate() + 6);
  fim.setHours(23, 59, 59, 999);
  return { inicio, fim };
}

// ─── Menu Principal ───────────────────────────────────────────────────────────

export async function enviarMenuPrincipal(para: string): Promise<void> {
  await enviarLista(
    para,
    "👋 *CaixaFood Bot*\n\nO que você deseja fazer?",
    "Ver opções",
    [
      {
        titulo: "📊 Consultas",
        itens: [
          { id: "saldo", titulo: "💰 Saldo atual", descricao: "Ver o saldo do caixa agora" },
          { id: "hoje", titulo: "📅 Resumo de hoje", descricao: "Entradas e saídas do dia" },
          { id: "semana", titulo: "📆 Resumo da semana", descricao: "Total da semana atual" },
          { id: "ultimos", titulo: "🗒 Últimos lançamentos", descricao: "Ver os 5 últimos" },
        ],
      },
      {
        titulo: "💸 Lançamentos",
        itens: [
          { id: "entrada", titulo: "➕ Registrar entrada", descricao: "Venda, receita ou depósito" },
          { id: "saida", titulo: "➖ Registrar saída", descricao: "Compra, despesa ou retirada" },
        ],
      },
      {
        titulo: "📦 Estoque",
        itens: [
          { id: "estoque", titulo: "📦 Ver estoque", descricao: "Produtos e quantidades" },
          { id: "estoque_baixo", titulo: "⚠️ Estoque baixo", descricao: "Produtos abaixo do ideal" },
          { id: "atualizar_estoque", titulo: "✏️ Atualizar estoque", descricao: "Registrar contagem" },
        ],
      },
      {
        titulo: "📸 Nota Fiscal",
        itens: [
          { id: "nota", titulo: "📸 Enviar nota fiscal", descricao: "Foto da nota → saída automática" },
        ],
      },
    ]
  );
}

// ─── Consultas ────────────────────────────────────────────────────────────────

async function consultarSaldo(de: string, estabId: string): Promise<void> {
  const estab = await prisma.estabelecimento.findUnique({
    where: { id: estabId },
    select: { nome: true, saldoInicialCentavos: true, saldoInicialData: true },
  });

  const lancamentos = await prisma.lancamento.findMany({
    where: {
      estabelecimentoId: estabId,
      status: "CONFIRMADO",
      ...(estab?.saldoInicialData ? { data: { gte: estab.saldoInicialData } } : {}),
    },
    select: { tipo: true, valorCentavos: true, taxaDescontadaCentavos: true },
  });

  let saldo = estab?.saldoInicialCentavos ?? 0;
  for (const l of lancamentos) {
    if (l.tipo === "ENTRADA") saldo += l.valorCentavos - l.taxaDescontadaCentavos;
    else saldo -= l.valorCentavos;
  }

  const emoji = saldo >= 0 ? "✅" : "⚠️";
  await enviarMensagem(
    de,
    `${emoji} *Saldo atual — ${estab?.nome}*\n\n💰 R$ ${fmt(saldo)}\n\n_Digite *menu* para voltar_`
  );
}

async function resumoDia(de: string, estabId: string): Promise<void> {
  const { inicio, fim } = hoje();
  const lancamentos = await prisma.lancamento.findMany({
    where: { estabelecimentoId: estabId, data: { gte: inicio, lte: fim }, status: "CONFIRMADO" },
    select: { tipo: true, valorCentavos: true, taxaDescontadaCentavos: true },
  });

  let entradas = 0, saidas = 0;
  for (const l of lancamentos) {
    if (l.tipo === "ENTRADA") entradas += l.valorCentavos - l.taxaDescontadaCentavos;
    else saidas += l.valorCentavos;
  }

  const data = new Date().toLocaleDateString("pt-BR");
  await enviarMensagem(
    de,
    `📅 *Resumo de hoje — ${data}*\n\n` +
      `➕ Entradas: R$ ${fmt(entradas)}\n` +
      `➖ Saídas:   R$ ${fmt(saidas)}\n` +
      `────────────────\n` +
      `💰 Resultado: R$ ${fmt(entradas - saidas)}\n\n` +
      `_${lancamentos.length} lançamento(s) hoje_\n\n_Digite *menu* para voltar_`
  );
}

async function resumoSemana(de: string, estabId: string): Promise<void> {
  const { inicio, fim } = semana();
  const lancamentos = await prisma.lancamento.findMany({
    where: { estabelecimentoId: estabId, data: { gte: inicio, lte: fim }, status: "CONFIRMADO" },
    select: { tipo: true, valorCentavos: true, taxaDescontadaCentavos: true },
  });

  let entradas = 0, saidas = 0;
  for (const l of lancamentos) {
    if (l.tipo === "ENTRADA") entradas += l.valorCentavos - l.taxaDescontadaCentavos;
    else saidas += l.valorCentavos;
  }

  const ini = inicio.toLocaleDateString("pt-BR");
  const fimStr = fim.toLocaleDateString("pt-BR");
  await enviarMensagem(
    de,
    `📆 *Resumo da semana*\n${ini} a ${fimStr}\n\n` +
      `➕ Entradas: R$ ${fmt(entradas)}\n` +
      `➖ Saídas:   R$ ${fmt(saidas)}\n` +
      `────────────────\n` +
      `💰 Resultado: R$ ${fmt(entradas - saidas)}\n\n` +
      `_${lancamentos.length} lançamento(s) na semana_\n\n_Digite *menu* para voltar_`
  );
}

async function ultimosLancamentos(de: string, estabId: string): Promise<void> {
  const lancamentos = await prisma.lancamento.findMany({
    where: { estabelecimentoId: estabId },
    orderBy: { data: "desc" },
    take: 5,
    select: { tipo: true, descricao: true, valorCentavos: true, data: true, categoria: { select: { nome: true } } },
  });

  if (lancamentos.length === 0) {
    await enviarMensagem(de, "📋 Nenhum lançamento encontrado.\n\n_Digite *menu* para voltar_");
    return;
  }

  const linhas = lancamentos.map((l) => {
    const emoji = l.tipo === "ENTRADA" ? "➕" : "➖";
    const data = l.data.toLocaleDateString("pt-BR");
    const cat = l.categoria?.nome ?? "Sem categoria";
    return `${emoji} *${l.descricao}*\nR$ ${fmt(l.valorCentavos)} · ${data} · ${cat}`;
  });

  await enviarMensagem(
    de,
    `🗒 *Últimos 5 lançamentos*\n\n${linhas.join("\n\n")}\n\n_Digite *menu* para voltar_`
  );
}

// ─── Estoque ──────────────────────────────────────────────────────────────────

async function verEstoque(de: string, estabId: string): Promise<void> {
  const produtos = await prisma.produtoEstoque.findMany({
    where: { estabelecimentoId: estabId },
    orderBy: { nome: "asc" },
  });

  if (produtos.length === 0) {
    await enviarMensagem(de, "📦 Nenhum produto cadastrado no estoque.\n\n_Digite *menu* para voltar_");
    return;
  }

  const linhas = produtos.map((p) => {
    const alerta = p.quantidadeAtual <= p.quantidadeIdeal ? " ⚠️" : "";
    return `• *${p.nome}*: ${p.quantidadeAtual} ${p.unidade}${alerta}`;
  });

  await enviarMensagem(
    de,
    `📦 *Estoque atual*\n\n${linhas.join("\n")}\n\n⚠️ = abaixo do mínimo ideal\n\n_Digite *menu* para voltar_`
  );
}

async function estoqueBaixo(de: string, estabId: string): Promise<void> {
  const produtos = await prisma.produtoEstoque.findMany({
    where: { estabelecimentoId: estabId },
  });

  const baixo = produtos.filter((p) => p.quantidadeAtual <= p.quantidadeIdeal);

  if (baixo.length === 0) {
    await enviarMensagem(de, "✅ Nenhum produto abaixo do estoque mínimo!\n\n_Digite *menu* para voltar_");
    return;
  }

  const linhas = baixo.map(
    (p) => `⚠️ *${p.nome}*: ${p.quantidadeAtual}/${p.quantidadeIdeal} ${p.unidade}`
  );

  await enviarMensagem(
    de,
    `⚠️ *Estoque baixo — ${baixo.length} produto(s)*\n\n${linhas.join("\n")}\n\n_Digite *menu* para voltar_`
  );
}

async function iniciarAtualizarEstoque(de: string, estabId: string): Promise<void> {
  const produtos = await prisma.produtoEstoque.findMany({
    where: { estabelecimentoId: estabId },
    orderBy: { nome: "asc" },
    take: 10,
  });

  if (produtos.length === 0) {
    await enviarMensagem(de, "📦 Nenhum produto cadastrado.\n\n_Digite *menu* para voltar_");
    return;
  }

  const linhas = produtos.map((p, i) => `${i + 1}. ${p.nome} (atual: ${p.quantidadeAtual} ${p.unidade})`);
  await enviarMensagem(
    de,
    `✏️ *Qual produto deseja atualizar?*\n\n${linhas.join("\n")}\n\nDigite o *número* do produto:`
  );
  await setEstado(de, "ESTOQUE_ATUALIZAR_PRODUTO", {
    categorias: produtos.map((p) => ({ id: p.id, nome: p.nome })),
  });
}

// ─── Lançamentos ──────────────────────────────────────────────────────────────

async function iniciarEntrada(de: string): Promise<void> {
  await enviarMensagem(de, "➕ *Registrar entrada*\n\nDigite o *valor* da entrada:\n_(ex: 150,00)_");
  await setEstado(de, "ENTRADA_VALOR", { tipo: "ENTRADA" });
}

async function iniciarSaida(de: string): Promise<void> {
  await enviarMensagem(de, "➖ *Registrar saída*\n\nDigite o *valor* da saída:\n_(ex: 80,50)_");
  await setEstado(de, "SAIDA_VALOR", { tipo: "SAIDA" });
}

async function pedirCategoria(de: string, estabId: string, tipo: "ENTRADA" | "SAIDA", dados: DadosParciais): Promise<void> {
  const categorias = await prisma.categoria.findMany({
    where: { estabelecimentoId: estabId, tipo },
    select: { id: true, nome: true },
    orderBy: { nome: "asc" },
    take: 10,
  });

  const linhas = categorias.map((c, i) => `${i + 1}. ${c.nome}`);
  await enviarMensagem(
    de,
    `🗂 *Escolha a categoria:*\n\n${linhas.join("\n")}\n\nDigite o *número* da categoria (ou 0 para "Sem categoria"):`
  );
  await setEstado(de, tipo === "ENTRADA" ? "ENTRADA_CAT" : "SAIDA_CAT", {
    ...dados,
    categorias,
  });
}

async function salvarLancamento(
  de: string,
  estabId: string,
  tipo: "ENTRADA" | "SAIDA",
  valorCentavos: number,
  descricao: string,
  categoriaId: string | null
): Promise<void> {
  await prisma.lancamento.create({
    data: {
      tipo,
      descricao,
      valorCentavos,
      taxaDescontadaCentavos: 0,
      data: new Date(),
      origem: "WHATSAPP",
      status: "CONFIRMADO",
      estabelecimentoId: estabId,
      categoriaId,
    },
  });

  const emoji = tipo === "ENTRADA" ? "✅ *Entrada registrada!*" : "✅ *Saída registrada!*";
  await enviarBotoes(
    de,
    `${emoji}\n\n💰 R$ ${fmt(valorCentavos)}\n📝 ${descricao}\n\nO que deseja fazer agora?`,
    [
      { id: "menu", titulo: "📋 Menu principal" },
      { id: tipo === "ENTRADA" ? "entrada" : "saida", titulo: tipo === "ENTRADA" ? "➕ Nova entrada" : "➖ Nova saída" },
      { id: "saldo", titulo: "💰 Ver saldo" },
    ]
  );

  await resetEstado(de);
}

// ─── Processador principal ────────────────────────────────────────────────────

export async function processarMensagemBot(de: string, texto: string): Promise<void> {
  const estab = await prisma.estabelecimento.findFirst({
    where: { whatsappTelefone: de },
    select: { id: true, nome: true },
  });

  if (!estab) {
    await enviarMensagem(
      de,
      "❌ Número não vinculado a nenhuma conta.\n\nAcesse *caixafood.vercel.app/configuracoes* e cadastre seu WhatsApp para usar este recurso."
    );
    return;
  }

  const { estado, dados } = await getEstado(de);
  const lower = texto.toLowerCase().trim();

  // Comandos globais — funcionam em qualquer estado
  if (["menu", "inicio", "início", "cancelar", "voltar", "0"].includes(lower)) {
    await resetEstado(de);
    await enviarMenuPrincipal(de);
    return;
  }

  // ── Estado IDLE — processar comandos ou seleção de menu ──────────────────
  if (estado === "IDLE") {
    if (["oi", "olá", "ola", "boa tarde", "bom dia", "boa noite", "ajuda"].includes(lower)) {
      await enviarMenuPrincipal(de);
      return;
    }

    switch (lower) {
      case "saldo":
        await consultarSaldo(de, estab.id);
        break;
      case "hoje":
        await resumoDia(de, estab.id);
        break;
      case "semana":
        await resumoSemana(de, estab.id);
        break;
      case "ultimos":
      case "últimos":
        await ultimosLancamentos(de, estab.id);
        break;
      case "entrada":
        await iniciarEntrada(de);
        break;
      case "saida":
      case "saída":
        await iniciarSaida(de);
        break;
      case "estoque":
        await verEstoque(de, estab.id);
        break;
      case "estoque_baixo":
        await estoqueBaixo(de, estab.id);
        break;
      case "atualizar_estoque":
        await iniciarAtualizarEstoque(de, estab.id);
        break;
      case "nota":
        await enviarMensagem(de, "📸 *Envie uma foto da nota fiscal* e registrarei a saída automaticamente!");
        break;
      default:
        await enviarMensagem(
          de,
          "Não entendi. 🤔\n\nDigite *menu* para ver as opções disponíveis."
        );
    }
    return;
  }

  // ── Fluxo de entrada ──────────────────────────────────────────────────────
  if (estado === "ENTRADA_VALOR") {
    const valor = parseMoeda(texto);
    if (!valor) {
      await enviarMensagem(de, "❌ Valor inválido. Digite apenas o número, ex: *150,00*");
      return;
    }
    await enviarMensagem(de, `💰 R$ ${fmt(valor)} anotado!\n\nAgora digite a *descrição*:\n_(ex: Venda do almoço, Ifood, etc.)_`);
    await setEstado(de, "ENTRADA_DESC", { ...dados, valorCentavos: valor });
    return;
  }

  if (estado === "ENTRADA_DESC") {
    if (texto.trim().length < 2) {
      await enviarMensagem(de, "❌ Descrição muito curta. Tente novamente:");
      return;
    }
    await pedirCategoria(de, estab.id, "ENTRADA", { ...dados, descricao: texto.trim() as unknown as number });
    return;
  }

  if (estado === "ENTRADA_CAT") {
    const categorias = dados.categorias ?? [];
    const num = parseInt(texto.trim());
    let catId: string | null = null;

    if (num === 0) {
      catId = null;
    } else if (num >= 1 && num <= categorias.length) {
      catId = categorias[num - 1].id;
    } else {
      await enviarMensagem(de, `❌ Digite um número entre 0 e ${categorias.length}:`);
      return;
    }

    await salvarLancamento(
      de,
      estab.id,
      "ENTRADA",
      dados.valorCentavos!,
      dados.descricao as unknown as string,
      catId
    );
    return;
  }

  // ── Fluxo de saída ────────────────────────────────────────────────────────
  if (estado === "SAIDA_VALOR") {
    const valor = parseMoeda(texto);
    if (!valor) {
      await enviarMensagem(de, "❌ Valor inválido. Digite apenas o número, ex: *80,50*");
      return;
    }
    await enviarMensagem(de, `💰 R$ ${fmt(valor)} anotado!\n\nAgora digite a *descrição*:\n_(ex: Compra de insumos, Gás, etc.)_`);
    await setEstado(de, "SAIDA_DESC", { ...dados, valorCentavos: valor });
    return;
  }

  if (estado === "SAIDA_DESC") {
    if (texto.trim().length < 2) {
      await enviarMensagem(de, "❌ Descrição muito curta. Tente novamente:");
      return;
    }
    await pedirCategoria(de, estab.id, "SAIDA", { ...dados, descricao: texto.trim() as unknown as number });
    return;
  }

  if (estado === "SAIDA_CAT") {
    const categorias = dados.categorias ?? [];
    const num = parseInt(texto.trim());
    let catId: string | null = null;

    if (num === 0) {
      catId = null;
    } else if (num >= 1 && num <= categorias.length) {
      catId = categorias[num - 1].id;
    } else {
      await enviarMensagem(de, `❌ Digite um número entre 0 e ${categorias.length}:`);
      return;
    }

    await salvarLancamento(
      de,
      estab.id,
      "SAIDA",
      dados.valorCentavos!,
      dados.descricao as unknown as string,
      catId
    );
    return;
  }

  // ── Fluxo de atualização de estoque ──────────────────────────────────────
  if (estado === "ESTOQUE_ATUALIZAR_PRODUTO") {
    const produtos = dados.categorias ?? [];
    const num = parseInt(texto.trim());

    if (num < 1 || num > produtos.length) {
      await enviarMensagem(de, `❌ Digite um número entre 1 e ${produtos.length}:`);
      return;
    }

    const produto = produtos[num - 1];
    await enviarMensagem(de, `✏️ *${produto.nome}*\n\nDigite a nova *quantidade em estoque*:`);
    await setEstado(de, "ESTOQUE_ATUALIZAR_QTDE", { produtoId: produto.id, produtoNome: produto.nome });
    return;
  }

  if (estado === "ESTOQUE_ATUALIZAR_QTDE") {
    const qtde = parseFloat(texto.replace(",", "."));
    if (isNaN(qtde) || qtde < 0) {
      await enviarMensagem(de, "❌ Quantidade inválida. Digite um número, ex: *5* ou *2,5*");
      return;
    }

    await prisma.produtoEstoque.update({
      where: { id: dados.produtoId! },
      data: { quantidadeAtual: qtde },
    });

    await enviarBotoes(
      de,
      `✅ *Estoque atualizado!*\n\n📦 ${dados.produtoNome}: ${qtde}`,
      [
        { id: "menu", titulo: "📋 Menu principal" },
        { id: "estoque", titulo: "📦 Ver estoque" },
        { id: "atualizar_estoque", titulo: "✏️ Atualizar outro" },
      ]
    );

    await resetEstado(de);
    return;
  }

  // Fallback
  await enviarMensagem(de, "Digite *menu* para ver as opções disponíveis.");
  await resetEstado(de);
}
