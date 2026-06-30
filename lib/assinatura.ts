import { prisma } from "./prisma";

// Quantos dias antes do vencimento o aviso amarelo começa a aparecer.
export const DIAS_AVISO = 5;

export type Plano = "MENSAL" | "TRIMESTRAL" | "SEMESTRAL" | "ANUAL";
// PENDENTE = conta antiga aguardando liberação manual (fluxo legado).
// TRIAL = conta nova, com acesso liberado durante o período de teste grátis.
export type StatusAssinatura = "PENDENTE" | "TRIAL" | "ATIVA" | "PAUSADA" | "CANCELADA";

// Situação derivada (calculada), usada para avisos e badges.
export type Situacao =
  | "PENDENTE"
  | "TRIAL"
  | "EM_DIA"
  | "PROXIMA"
  | "VENCIDA"
  | "PAUSADA"
  | "CANCELADA";

// Preço padrão do plano mensal (R$ 300) — valor inicial de uma conta nova.
export const PRECO_MENSAL_CENTAVOS = 30000;

// Dias de teste grátis para contas novas.
export const DIAS_TRIAL = 15;

// A partir de quantos dias restantes o trial entra no "alerta vermelho" (cobrar).
export const DIAS_AVISO_TRIAL = 3;

export const PLANOS: { v: Plano; l: string; meses: number }[] = [
  { v: "MENSAL", l: "Mensal", meses: 1 },
  { v: "TRIMESTRAL", l: "Trimestral", meses: 3 },
  { v: "SEMESTRAL", l: "Semestral", meses: 6 },
  { v: "ANUAL", l: "Anual", meses: 12 },
];

export function mesesDoPlano(plano: string): number {
  return PLANOS.find((p) => p.v === plano)?.meses ?? 1;
}

export function rotuloPlano(plano: string): string {
  return PLANOS.find((p) => p.v === plano)?.l ?? plano;
}

function inicioDoDia(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

// Dias inteiros até o vencimento. Negativo = vencido há N dias.
export function diasAteVencimento(proximoVencimento: Date): number {
  const hoje = inicioDoDia(new Date());
  const venc = inicioDoDia(proximoVencimento);
  return Math.round((venc.getTime() - hoje.getTime()) / 86_400_000);
}

export type AssinaturaLike = { status: string; proximoVencimento: Date };

export function calcularSituacao(a: AssinaturaLike): { situacao: Situacao; dias: number } {
  if (a.status === "PENDENTE") return { situacao: "PENDENTE", dias: 0 };
  if (a.status === "PAUSADA") return { situacao: "PAUSADA", dias: 0 };
  if (a.status === "CANCELADA") return { situacao: "CANCELADA", dias: 0 };

  const dias = diasAteVencimento(a.proximoVencimento);

  if (a.status === "TRIAL") {
    // Trial vencido => bloqueia igual a uma mensalidade vencida.
    if (dias < 0) return { situacao: "VENCIDA", dias };
    return { situacao: "TRIAL", dias };
  }

  if (dias < 0) return { situacao: "VENCIDA", dias };
  if (dias <= DIAS_AVISO) return { situacao: "PROXIMA", dias };
  return { situacao: "EM_DIA", dias };
}

// Soma dias a uma data, no início do dia.
export function adicionarDias(data: Date, dias: number): Date {
  const d = inicioDoDia(data);
  d.setDate(d.getDate() + dias);
  return d;
}

// Soma meses tratando overflow de fim de mês (31/jan + 1 mês => 28/29 fev).
export function adicionarMeses(data: Date, meses: number): Date {
  const d = new Date(data);
  const diaOriginal = d.getDate();
  d.setMonth(d.getMonth() + meses);
  if (d.getDate() < diaOriginal) d.setDate(0);
  return d;
}

// Próximo vencimento ao registrar um pagamento: estende a partir da data de
// vencimento atual (se ainda no futuro) ou de hoje (se já vencida).
export function proximoVencimentoAposPagamento(
  vencimentoAtual: Date,
  plano: string
): Date {
  const hoje = inicioDoDia(new Date());
  const base = vencimentoAtual > hoje ? vencimentoAtual : hoje;
  return adicionarMeses(base, mesesDoPlano(plano));
}

// Garante que o usuário tem uma assinatura; cria uma padrão (30 dias de
// cortesia) se ainda não existir. Idempotente.
export async function garantirAssinatura(usuarioId: string) {
  const existe = await prisma.assinatura.findUnique({ where: { usuarioId } });
  if (existe) return existe;
  return prisma.assinatura.create({
    data: {
      usuarioId,
      status: "ATIVA",
      plano: "MENSAL",
      valorCentavos: 0,
      proximoVencimento: adicionarMeses(new Date(), 1),
    },
  });
}

// Cria a assinatura de uma conta recém-cadastrada como TRIAL: o acesso já
// nasce liberado e dura DIAS_TRIAL dias; ao final, vira VENCIDA automaticamente.
export async function criarAssinaturaTrial(usuarioId: string) {
  return prisma.assinatura.create({
    data: {
      usuarioId,
      status: "TRIAL",
      plano: "MENSAL",
      valorCentavos: PRECO_MENSAL_CENTAVOS,
      proximoVencimento: adicionarDias(new Date(), DIAS_TRIAL),
    },
  });
}
