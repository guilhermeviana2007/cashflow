// Períodos de análise para o dashboard.
export type PeriodoId = "hoje" | "7d" | "30d" | "90d" | "180d" | "365d";

export const PERIODOS: { id: PeriodoId; label: string; dias: number }[] = [
  { id: "hoje", label: "Hoje", dias: 1 },
  { id: "7d", label: "Semana", dias: 7 },
  { id: "30d", label: "Mês", dias: 30 },
  { id: "90d", label: "Trimestre", dias: 90 },
  { id: "180d", label: "Semestre", dias: 180 },
  { id: "365d", label: "Ano", dias: 365 },
];

export function resolverPeriodo(id?: string): { id: PeriodoId; dias: number; inicio: Date; fim: Date } {
  // Default: mês.
  const p =
    PERIODOS.find((x) => x.id === id) ?? PERIODOS.find((x) => x.id === "30d")!;
  const fim = new Date();
  fim.setHours(23, 59, 59, 999);
  const inicio = new Date();
  inicio.setDate(inicio.getDate() - (p.dias - 1));
  inicio.setHours(0, 0, 0, 0);
  return { id: p.id, dias: p.dias, inicio, fim };
}

// Define o agrupamento do gráfico temporal conforme o tamanho do período.
export type Granularidade = "dia" | "semana" | "mes";

export function granularidadeDoPeriodo(dias: number): Granularidade {
  if (dias <= 31) return "dia";
  if (dias <= 180) return "semana";
  return "mes";
}

// Gera a chave do "balde" (bucket) temporal de uma data.
export function chaveBucket(data: Date, gran: Granularidade): string {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  if (gran === "mes") return `${ano}-${mes}`;
  if (gran === "dia") return `${ano}-${mes}-${dia}`;
  // semana: usa a segunda-feira como âncora
  const d = new Date(data);
  const diaSemana = (d.getDay() + 6) % 7; // 0 = segunda
  d.setDate(d.getDate() - diaSemana);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export function rotuloBucket(chave: string, gran: Granularidade): string {
  if (gran === "mes") {
    const [ano, mes] = chave.split("-");
    const nomes = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
    return `${nomes[Number(mes) - 1]}/${ano.slice(2)}`;
  }
  const [, mes, dia] = chave.split("-");
  return `${dia}/${mes}`;
}
