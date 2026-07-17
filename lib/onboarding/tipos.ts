// Vocabulário do onboarding. Compartilhado entre o formulário (client),
// as server actions e o painel admin — fonte única de plano/serviço/etapa.

export const PLANOS = ["ENTRADA", "INTERMEDIARIO", "PREMIUM"] as const;
export type Plano = (typeof PLANOS)[number];

export const ROTULO_PLANO: Record<Plano, string> = {
  ENTRADA: "Entrada / Essencial",
  INTERMEDIARIO: "Intermediário",
  PREMIUM: "Premium",
};

// Dias de acompanhamento por plano — usado nos textos de expectativa (Etapas 6 e 14).
export const DIAS_ACOMPANHAMENTO: Record<Plano, number | null> = {
  ENTRADA: null,
  INTERMEDIARIO: 15,
  PREMIUM: 30,
};

export const SERVICOS = ["site", "sistema", "instagram", "google", "ads"] as const;
export type Servico = (typeof SERVICOS)[number];

export const ROTULO_SERVICO: Record<Servico, string> = {
  site: "Site comercial/institucional com painel administrativo",
  sistema: "Sistema interno personalizado",
  instagram: "Otimização profissional do Instagram",
  google: "Perfil da Empresa no Google + SEO local",
  ads: "Google Ads",
};

// Serviços exclusivos do Premium. O admin não consegue montar um convite
// Entrada com "sistema" — a regra vive aqui e é checada no servidor.
const SO_PREMIUM: Servico[] = ["sistema", "ads"];

export function servicoPermitido(servico: Servico, plano: Plano): boolean {
  return !SO_PREMIUM.includes(servico) || plano === "PREMIUM";
}

export function servicosPermitidos(plano: Plano): Servico[] {
  return SERVICOS.filter((s) => servicoPermitido(s, plano));
}

export function ehPlano(v: unknown): v is Plano {
  return typeof v === "string" && (PLANOS as readonly string[]).includes(v);
}

export function ehServico(v: unknown): v is Servico {
  return typeof v === "string" && (SERVICOS as readonly string[]).includes(v);
}

// ---------------------------------------------------------------------------
// Etapas
// ---------------------------------------------------------------------------

// `servico: null` = etapa do tronco comum, aparece para todo mundo.
export type DefEtapa = {
  id: string;
  titulo: string;
  servico: Servico | null;
};

export const ETAPAS: DefEtapa[] = [
  { id: "boasVindas", titulo: "Boas-vindas", servico: null },
  { id: "escopo", titulo: "Escopo contratado", servico: null },
  { id: "empresa", titulo: "Dados da empresa", servico: null },
  { id: "contatos", titulo: "Contatos e responsáveis", servico: null },
  { id: "comercial", titulo: "Informações comerciais", servico: null },
  { id: "marca", titulo: "Identidade da marca", servico: null },
  { id: "site", titulo: "Site e painel administrativo", servico: "site" },
  { id: "sistema", titulo: "Sistema interno", servico: "sistema" },
  { id: "instagram", titulo: "Instagram", servico: "instagram" },
  { id: "google", titulo: "Google + SEO local", servico: "google" },
  { id: "ads", titulo: "Google Ads", servico: "ads" },
  { id: "acessos", titulo: "Acessos necessários", servico: null },
  { id: "aprovacao", titulo: "Aprovação e comunicação", servico: null },
  { id: "adicionais", titulo: "Informações adicionais", servico: null },
  { id: "revisao", titulo: "Revisão e termo", servico: null },
];

// As etapas que este cliente realmente vê. É isto que define o "Etapa X de Y".
export function etapasVisiveis(servicos: Servico[]): DefEtapa[] {
  return ETAPAS.filter((e) => e.servico === null || servicos.includes(e.servico));
}

// ---------------------------------------------------------------------------
// Pendências
// ---------------------------------------------------------------------------

export type Criticidade = "bloqueante" | "atencao" | "normal";
export type Responsavel = "cliente" | "equipe";

export type Pendencia = {
  texto: string;
  responsavel: Responsavel;
  criticidade: Criticidade;
};

export const ORDEM_CRITICIDADE: Record<Criticidade, number> = {
  bloqueante: 0,
  atencao: 1,
  normal: 2,
};

// Respostas: objeto aninhado por etapa. Frouxo de propósito — o formato é
// definido pelas etapas e validado na borda, não pelo tipo.
export type Respostas = Record<string, Record<string, unknown>>;
