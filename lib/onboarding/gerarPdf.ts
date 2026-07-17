import "server-only";
import { PDFDocument, StandardFonts, rgb, type PDFPage, type PDFFont } from "pdf-lib";
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

const ICONE_PENDENCIA: Record<Pendencia["criticidade"], string> = {
  bloqueante: "[BLOQUEANTE]",
  atencao: "[ATENÇÃO]",
  normal: "[OK]",
};

// Etapa id -> título legível (mesma fonte usada no formulário e no painel).
const TITULO_ETAPA = new Map(ETAPAS.map((e) => [e.id, e.titulo]));

export async function gerarPdfOnboarding(d: DadosPdf): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const fonteRegular = await doc.embedFont(StandardFonts.Helvetica);
  const fonteNegrito = await doc.embedFont(StandardFonts.HelveticaBold);

  const w = new Escritor(doc, fonteRegular, fonteNegrito);

  w.titulo("Onboarding — " + d.nomeCliente);
  w.linha(`E-mail: ${d.emailCliente}`);
  w.linha(`Plano: ${ROTULO_PLANO[d.plano as Plano] ?? d.plano}`);
  w.linha(`Serviços: ${d.servicos.map((s) => ROTULO_SERVICO[s as Servico] ?? s).join(", ")}`);
  w.linha(`Respondido em: ${d.enviadoEm}`);
  w.espaco(10);

  w.subtitulo("Termo de veracidade");
  w.linha(`Assinado por ${d.aceiteNome} (${d.aceiteCargo})`);
  w.espaco(14);

  w.subtitulo("Pendências");
  if (d.pendencias.length === 0) {
    w.linha("Nenhuma.");
  } else {
    for (const p of d.pendencias) {
      w.linha(`${ICONE_PENDENCIA[p.criticidade]} ${p.texto} (${p.responsavel})`);
    }
  }
  w.espaco(14);

  w.subtitulo("Respostas");
  for (const [etapa, campos] of Object.entries(d.respostas)) {
    w.espaco(8);
    w.secao(TITULO_ETAPA.get(etapa) ?? etapa);
    for (const [chave, valor] of Object.entries(campos ?? {})) {
      const texto = typeof valor === "object" && valor !== null ? JSON.stringify(valor) : String(valor);
      w.pergunta(chave);
      w.resposta(texto || "—");
    }
  }

  return doc.save();
}

// Encapsula quebra de página e posição do cursor — o resto do código só chama
// métodos semânticos (titulo/linha/pergunta/resposta) sem pensar em coordenadas.
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

  private novaPaginaSeNecessario(alturaNecessaria: number) {
    if (this.y - alturaNecessaria < MARGEM) {
      this.pagina = this.doc.addPage([LARGURA, ALTURA]);
      this.y = ALTURA - MARGEM;
    }
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

  private escreverBloco(texto: string, fonte: PDFFont, tamanho: number, corCinza = 0) {
    const linhas = this.quebrarLinhas(texto, fonte, tamanho, LARGURA_UTIL);
    const altura = tamanho * 1.4;
    for (const linha of linhas) {
      this.novaPaginaSeNecessario(altura);
      this.pagina.drawText(linha, {
        x: MARGEM,
        y: this.y,
        size: tamanho,
        font: fonte,
        color: rgb(corCinza, corCinza, corCinza),
      });
      this.y -= altura;
    }
  }

  titulo(texto: string) {
    this.escreverBloco(texto, this.fonteNegrito, 18);
    this.y -= 6;
  }

  subtitulo(texto: string) {
    this.novaPaginaSeNecessario(24);
    this.escreverBloco(texto, this.fonteNegrito, 13);
    this.y -= 2;
  }

  secao(texto: string) {
    this.novaPaginaSeNecessario(20);
    this.escreverBloco(texto, this.fonteNegrito, 11, 0.15);
    this.y -= 2;
  }

  linha(texto: string) {
    this.escreverBloco(texto, this.fonteRegular, 10.5);
  }

  pergunta(texto: string) {
    this.escreverBloco(texto, this.fonteNegrito, 9.5, 0.25);
  }

  resposta(texto: string) {
    this.escreverBloco(texto, this.fonteRegular, 9.5);
    this.y -= 4;
  }

  espaco(pontos: number) {
    this.y -= pontos;
  }
}
