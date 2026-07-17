// Validação e máscaras de CPF/CNPJ/CEP/telefone.
// Sem "server-only" de propósito: o formulário valida no blur (client) e a
// server action revalida no envio. Mesma função nos dois lados.

export function soDigitos(v: string): string {
  return (v ?? "").replace(/\D/g, "");
}

// CPF: 11 dígitos, dois dígitos verificadores módulo 11.
export function cpfValido(entrada: string): boolean {
  const cpf = soDigitos(entrada);
  if (cpf.length !== 11) return false;
  // Rejeita 000.000.000-00, 111.111.111-11, etc. — passam no módulo mas não existem.
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  for (const [tamanho, posicao] of [
    [9, 10],
    [10, 11],
  ]) {
    let soma = 0;
    for (let i = 0; i < tamanho; i++) soma += Number(cpf[i]) * (posicao - i);
    let dv = (soma * 10) % 11;
    if (dv === 10) dv = 0;
    if (dv !== Number(cpf[tamanho])) return false;
  }
  return true;
}

// CNPJ: 14 dígitos, dois dígitos verificadores com pesos 2..9 cíclicos.
export function cnpjValido(entrada: string): boolean {
  const cnpj = soDigitos(entrada);
  if (cnpj.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(cnpj)) return false;

  const calcular = (tamanho: number): number => {
    let soma = 0;
    let peso = tamanho - 7;
    for (let i = 0; i < tamanho; i++) {
      soma += Number(cnpj[i]) * peso;
      peso -= 1;
      if (peso < 2) peso = 9;
    }
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };

  return calcular(12) === Number(cnpj[12]) && calcular(13) === Number(cnpj[13]);
}

// ---------------------------------------------------------------------------
// Máscaras — aplicadas conforme digita, sem travar apagar.
// ---------------------------------------------------------------------------

export function mascararCpf(v: string): string {
  const d = soDigitos(v).slice(0, 11);
  return d
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d{1,2})$/, ".$1-$2");
}

export function mascararCnpj(v: string): string {
  const d = soDigitos(v).slice(0, 14);
  return d
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}

export function mascararCep(v: string): string {
  const d = soDigitos(v).slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

// Aceita fixo (10 dígitos) e celular (11).
export function mascararTelefone(v: string): string {
  const d = soDigitos(v).slice(0, 11);
  if (d.length <= 2) return d.replace(/^(\d{0,2})/, "($1");
  if (d.length <= 6) return d.replace(/^(\d{2})(\d{0,4})/, "($1) $2");
  if (d.length <= 10) return d.replace(/^(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
  return d.replace(/^(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3");
}

export function telefoneValido(v: string): boolean {
  const d = soDigitos(v);
  return d.length === 10 || d.length === 11;
}

export function cepValido(v: string): boolean {
  return soDigitos(v).length === 8;
}

export function emailValido(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test((v ?? "").trim());
}
