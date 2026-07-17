import "server-only";
import { PDFDocument, StandardFonts, rgb, type Color, type PDFPage, type PDFFont } from "pdf-lib";
import { ETAPAS, ROTULO_PLANO, ROTULO_SERVICO, type Pendencia, type Plano, type Servico } from "./tipos";

export type DadosPdf = {
  nomeCliente: string;
  emailCliente: string;
  plano: string;
  servicos: string[];
  enviadoEm: string;
  aceiteNome: string;
  aceiteCargo: string;
  pendencias: Pendencia[];
  respostas: Record<string, Record<string, unknown>>;
};

const MARGEM = 50;
const LARGURA = 595.28; // A4
const ALTURA = 841.89;
const LARGURA_UTIL = LARGURA - MARGEM * 2;
const ALTURA_CABECALHO = 82;
// Coluna do rótulo — larga o bastante pra rótulos longos ("Formulário respondido em",
// "Senha atual compartilhada") não colarem na resposta. Mesma coordenada usada no
// cartão de dados e nos campos das etapas, então tudo fica alinhado verticalmente.
const LARGURA_ROTULO = 185;
const PADDING_CARTAO = 16;

// Paleta — mesmo verde da marca (--primary do painel), com tons de apoio.
const COR_PRIMARIA = rgb(0x15 / 255, 0xa0 / 255, 0x6a / 255);
const COR_PRIMARIA_CLARA = rgb(0xe9 / 255, 0xf7 / 255, 0xf1 / 255);
const COR_TEXTO = rgb(0.13, 0.13, 0.13);
const COR_MUTED = rgb(0.47, 0.47, 0.47);
const COR_BORDA = rgb(0.86, 0.86, 0.86);
const COR_BRANCO = rgb(1, 1, 1);
const COR_BLOQUEANTE = rgb(0.8, 0.18, 0.18);
const COR_ATENCAO = rgb(0.75, 0.5, 0.05);
const COR_NORMAL = rgb(0.55, 0.55, 0.55);

const COR_CRITICIDADE: Record<Pendencia["criticidade"], Color> = {
  bloqueante: COR_BLOQUEANTE,
  atencao: COR_ATENCAO,
  normal: COR_NORMAL,
};

const ROTULO_CRITICIDADE: Record<Pendencia["criticidade"], string> = {
  bloqueante: "Bloqueante",
  atencao: "Atenção",
  normal: "Normal",
};

// Etapa id -> título legível (mesma fonte usada no formulário e no painel).
const TITULO_ETAPA = new Map(ETAPAS.map((e) => [e.id, e.titulo]));

// Siglas comuns nos formulários — ficam em caixa alta mesmo depois de "humanizar" a chave.
const SIGLAS = new Set(["cnpj", "cpf", "cep", "ie", "im", "url", "ip", "seo", "cta", "ga", "gtm", "ads"]);

function humanizarChave(chave: string): string {
  const palavras = chave
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  return palavras
    .map((p, i) => {
      const min = p.toLowerCase();
      if (SIGLAS.has(min)) return min.toUpperCase();
      return i === 0 ? min.charAt(0).toUpperCase() + min.slice(1) : min;
    })
    .join(" ");
}

function formatarValor(valor: unknown): string {
  if (valor === null || valor === undefined || valor === "") return "—";
  if (typeof valor === "boolean") return valor ? "Sim" : "Não";
  if (Array.isArray(valor)) return valor.length ? valor.map(String).join(", ") : "—";
  if (typeof valor === "object") return JSON.stringify(valor);
  return String(valor);
}

export async function gerarPdfOnboarding(d: DadosPdf): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const fonteRegular = await doc.embedFont(StandardFonts.Helvetica);
  const fonteNegrito = await doc.embedFont(StandardFonts.HelveticaBold);

  const w = new Escritor(doc, fonteRegular, fonteNegrito);

  w.cabecalho(d.nomeCliente, ROTULO_PLANO[d.plano as Plano] ?? d.plano);

  w.cartao("Dados do cliente", [
    ["E-mail", d.emailCliente],
    ["Serviços contratados", d.servicos.map((s) => ROTULO_SERVICO[s as Servico] ?? s).join(", ")],
    ["Formulário respondido em", d.enviadoEm],
    ["Assinado por", `${d.aceiteNome} (${d.aceiteCargo})`],
  ]);

  w.tituloSecao("Pendências");
  if (d.pendencias.length === 0) {
    w.mensagemVazia("Nenhuma pendência — formulário completo.");
  } else {
    for (const p of d.pendencias) {
      w.linhaPendencia(p);
    }
  }

  w.tituloSecao("Respostas");
  for (const [etapa, campos] of Object.entries(d.respostas)) {
    const entradas = Object.entries(campos ?? {});
    if (entradas.length === 0) continue;
    const [primeiraChave, primeiroValor] = entradas[0];
    const alturaPrimeiraLinha = w.medirAlturaCampo(humanizarChave(primeiraChave), formatarValor(primeiroValor));
    w.subtituloEtapa(TITULO_ETAPA.get(etapa) ?? etapa, alturaPrimeiraLinha);
    for (const [chave, valor] of entradas) {
      w.linhaCampo(humanizarChave(chave), formatarValor(valor));
    }
  }

  w.finalizarRodape();

  return doc.save();
}

// Encapsula desenho e quebra de página — o resto do código só chama métodos
// semânticos (cabecalho/cartao/linhaCampo/…) sem pensar em coordenadas.
class Escritor {
  private pagina: PDFPage;
  private y: number;

  constructor(
    private doc: PDFDocument,
    private fonteRegular: PDFFont,
    private fonteNegrito: PDFFont
  ) {
    this.pagina = doc.addPage([LARGURA, ALTURA]);
    this.y = ALTURA - MARGEM;
  }

  private novaPagina() {
    this.pagina = this.doc.addPage([LARGURA, ALTURA]);
    this.y = ALTURA - MARGEM;
  }

  private novaPaginaSeNecessario(alturaNecessaria: number) {
    if (this.y - alturaNecessaria < MARGEM) this.novaPagina();
  }

  private quebrarLinhas(texto: string, fonte: PDFFont, tamanho: number, largura: number): string[] {
    const palavras = texto.split(/\s+/);
    const linhas: string[] = [];
    let atual = "";
    for (const palavra of palavras) {
      const teste = atual ? `${atual} ${palavra}` : palavra;
      if (fonte.widthOfTextAtSize(teste, tamanho) > largura && atual) {
        linhas.push(atual);
        atual = palavra;
      } else {
        atual = teste;
      }
    }
    if (atual) linhas.push(atual);
    return linhas.length > 0 ? linhas : [""];
  }

  private texto(conteudo: string, x: number, y: number, fonte: PDFFont, tamanho: number, cor: Color) {
    this.pagina.drawText(conteudo, { x, y, size: tamanho, font: fonte, color: cor });
  }

  // --- cabeçalho e cartão de dados --------------------------------------------

  cabecalho(nomeCliente: string, rotuloPlano: string) {
    this.pagina.drawRectangle({ x: 0, y: ALTURA - ALTURA_CABECALHO, width: LARGURA, height: ALTURA_CABECALHO, color: COR_PRIMARIA });
    this.texto("Onboarding do cliente", MARGEM, ALTURA - 30, this.fonteRegular, 10, COR_BRANCO);
    this.texto(nomeCliente, MARGEM, ALTURA - 56, this.fonteNegrito, 20, COR_BRANCO);

    const rotulo = `Plano ${rotuloPlano}`;
    const largurabadge = this.fonteNegrito.widthOfTextAtSize(rotulo, 9.5) + 20;
    this.pagina.drawRectangle({
      x: LARGURA - MARGEM - largurabadge,
      y: ALTURA - 44,
      width: largurabadge,
      height: 22,
      color: COR_BRANCO,
      opacity: 0.15,
    });
    this.texto(
      rotulo,
      LARGURA - MARGEM - largurabadge + 10,
      ALTURA - 37,
      this.fonteNegrito,
      9.5,
      COR_BRANCO
    );

    this.y = ALTURA - ALTURA_CABECALHO - 28;
  }

  cartao(titulo: string, campos: [string, string][]) {
    // Rótulo e valor usam a mesma coluna (LARGURA_ROTULO) que os campos das
    // etapas mais abaixo — os valores de todo o documento ficam alinhados.
    const larguraRotuloCartao = LARGURA_ROTULO - PADDING_CARTAO - 8;
    const larguraValorCartao = LARGURA_UTIL - LARGURA_ROTULO - PADDING_CARTAO;
    const linhas = campos.map(
      ([rotulo, valor]) =>
        [
          this.quebrarLinhas(rotulo, this.fonteNegrito, 9.5, larguraRotuloCartao),
          this.quebrarLinhas(valor, this.fonteRegular, 9.5, larguraValorCartao),
        ] as const
    );
    const alturaLinhas = linhas.reduce((soma, [ls, lv]) => soma + Math.max(ls.length, lv.length, 1) * 13, 0);
    const alturaCartao = 30 + alturaLinhas + 14;

    this.novaPaginaSeNecessario(alturaCartao);

    const topo = this.y;
    this.pagina.drawRectangle({
      x: MARGEM,
      y: topo - alturaCartao,
      width: LARGURA_UTIL,
      height: alturaCartao,
      color: COR_PRIMARIA_CLARA,
      borderColor: COR_BORDA,
      borderWidth: 1,
    });

    let yCartao = topo - 22;
    this.texto(titulo, MARGEM + PADDING_CARTAO, yCartao, this.fonteNegrito, 11, COR_TEXTO);
    yCartao -= 20;

    for (const [ls, lv] of linhas) {
      const nLinhas = Math.max(ls.length, lv.length);
      ls.forEach((l, i) => this.texto(l, MARGEM + PADDING_CARTAO, yCartao - i * 13, this.fonteNegrito, 9.5, COR_MUTED));
      lv.forEach((l, i) => this.texto(l, MARGEM + LARGURA_ROTULO, yCartao - i * 13, this.fonteRegular, 9.5, COR_TEXTO));
      yCartao -= nLinhas * 13;
    }

    this.y = topo - alturaCartao - 22;
  }

  // --- seções ------------------------------------------------------------------

  tituloSecao(texto: string) {
    this.novaPaginaSeNecessario(34);
    this.pagina.drawRectangle({ x: MARGEM, y: this.y - 4, width: 4, height: 18, color: COR_PRIMARIA });
    this.texto(texto, MARGEM + 12, this.y, this.fonteNegrito, 14, COR_TEXTO);
    this.y -= 26;
  }

  // reservaProximaLinha: altura do primeiro campo que vem logo abaixo, pra o
  // título de etapa não ficar sozinho no fim da página com o conteúdo dele
  // todo empurrado pra próxima (órfão).
  subtituloEtapa(texto: string, reservaProximaLinha = 0) {
    this.novaPaginaSeNecessario(28 + reservaProximaLinha);
    this.pagina.drawRectangle({ x: MARGEM, y: this.y - 2, width: LARGURA_UTIL, height: 20, color: COR_PRIMARIA_CLARA });
    this.texto(texto, MARGEM + 8, this.y + 3, this.fonteNegrito, 10.5, COR_PRIMARIA);
    this.y -= 30;
  }

  mensagemVazia(texto: string) {
    this.novaPaginaSeNecessario(20);
    this.texto(texto, MARGEM, this.y, this.fonteRegular, 10, COR_MUTED);
    this.y -= 24;
  }

  linhaPendencia(p: Pendencia) {
    const largurasLinhas = this.quebrarLinhas(p.texto, this.fonteRegular, 9.5, LARGURA_UTIL - 90);
    const altura = Math.max(largurasLinhas.length, 1) * 13 + 6;
    this.novaPaginaSeNecessario(altura);

    const topo = this.y;
    this.pagina.drawEllipse({ x: MARGEM + 3, y: topo - 3, xScale: 3, yScale: 3, color: COR_CRITICIDADE[p.criticidade] });
    this.texto(ROTULO_CRITICIDADE[p.criticidade], LARGURA - MARGEM - 70, topo - 4, this.fonteNegrito, 8, COR_CRITICIDADE[p.criticidade]);

    let y = topo;
    for (const l of largurasLinhas) {
      this.texto(l, MARGEM + 14, y - 4, this.fonteRegular, 9.5, COR_TEXTO);
      y -= 13;
    }

    this.y = topo - altura;
  }

  private linhasCampo(rotulo: string, valor: string) {
    const linhasRotulo = this.quebrarLinhas(rotulo, this.fonteNegrito, 9, LARGURA_ROTULO - 8);
    const linhasValor = this.quebrarLinhas(valor, this.fonteRegular, 9.5, LARGURA_UTIL - LARGURA_ROTULO);
    return { linhasRotulo, linhasValor, nLinhas: Math.max(linhasRotulo.length, linhasValor.length) };
  }

  // Altura que linhaCampo vai ocupar, sem desenhar nada — usada pra reservar
  // espaço junto com o título da etapa (ver subtituloEtapa).
  medirAlturaCampo(rotulo: string, valor: string): number {
    return this.linhasCampo(rotulo, valor).nLinhas * 13 + 8;
  }

  linhaCampo(rotulo: string, valor: string) {
    const { linhasRotulo, linhasValor, nLinhas } = this.linhasCampo(rotulo, valor);
    const altura = nLinhas * 13 + 8;

    this.novaPaginaSeNecessario(altura);

    const topo = this.y;
    linhasRotulo.forEach((l, i) => this.texto(l, MARGEM, topo - i * 13, this.fonteNegrito, 9, COR_MUTED));
    linhasValor.forEach((l, i) => this.texto(l, MARGEM + LARGURA_ROTULO, topo - i * 13, this.fonteRegular, 9.5, COR_TEXTO));

    this.y = topo - nLinhas * 13 - 4;
    this.pagina.drawLine({
      start: { x: MARGEM, y: this.y },
      end: { x: MARGEM + LARGURA_UTIL, y: this.y },
      thickness: 0.5,
      color: COR_BORDA,
    });
    this.y -= 8;
  }

  // --- rodapé --------------------------------------------------------------

  finalizarRodape() {
    const paginas = this.doc.getPages();
    const total = paginas.length;
    paginas.forEach((pagina, i) => {
      pagina.drawLine({
        start: { x: MARGEM, y: MARGEM - 14 },
        end: { x: LARGURA - MARGEM, y: MARGEM - 14 },
        thickness: 0.5,
        color: COR_BORDA,
      });
      pagina.drawText("CashFlow · Onboarding do cliente", {
        x: MARGEM,
        y: MARGEM - 26,
        size: 8,
        font: this.fonteRegular,
        color: COR_MUTED,
      });
      const rotulo = `Página ${i + 1} de ${total}`;
      const largura = this.fonteRegular.widthOfTextAtSize(rotulo, 8);
      pagina.drawText(rotulo, {
        x: LARGURA - MARGEM - largura,
        y: MARGEM - 26,
        size: 8,
        font: this.fonteRegular,
        color: COR_MUTED,
      });
    });
  }
}
