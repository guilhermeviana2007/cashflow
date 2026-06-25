// Utilitários de formatação e valores monetários.
// Regra de ouro: dinheiro é guardado em CENTAVOS (inteiro) no banco.

export function formatBRL(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

// Converte texto digitado pelo usuário ("1.234,56" ou "1234.56" ou "1234,5") em centavos.
export function reaisParaCentavos(texto: string): number {
  if (!texto) return 0;
  const limpo = texto
    .replace(/\s/g, "")
    .replace("R$", "")
    .replace(/\./g, "") // remove separador de milhar
    .replace(",", "."); // vírgula decimal -> ponto
  const valor = Number(limpo);
  if (Number.isNaN(valor)) return 0;
  return Math.round(valor * 100);
}

export function formatData(data: Date): string {
  return data.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
