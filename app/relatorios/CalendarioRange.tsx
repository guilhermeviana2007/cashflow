"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const DIAS_SEMANA = ["Do", "Se", "Te", "Qu", "Qu", "Se", "Sá"];
const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function parse(s: string): Date | null {
  if (!s) return null;
  const d = new Date(s + "T12:00:00");
  return isNaN(d.getTime()) ? null : d;
}
function chave(d: Date) {
  return d.getFullYear() * 10000 + d.getMonth() * 100 + d.getDate();
}
function iso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}
function fmt(d: Date) {
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(
    2,
    "0"
  )}/${d.getFullYear()}`;
}
function celulas(ano: number, mes: number): (Date | null)[] {
  const offset = new Date(ano, mes, 1).getDay();
  const total = new Date(ano, mes + 1, 0).getDate();
  const arr: (Date | null)[] = [];
  for (let i = 0; i < offset; i++) arr.push(null);
  for (let d = 1; d <= total; d++) arr.push(new Date(ano, mes, d));
  return arr;
}

export function CalendarioRange({
  deInicial,
  ateInicial,
  ativo,
}: {
  deInicial: string;
  ateInicial: string;
  ativo: boolean;
}) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [inicio, setInicio] = useState<Date | null>(parse(deInicial));
  const [fim, setFim] = useState<Date | null>(parse(ateInicial));
  const [hover, setHover] = useState<Date | null>(null);

  const base0 = parse(deInicial) ?? new Date();
  const [mesBase, setMesBase] = useState(
    new Date(base0.getFullYear(), base0.getMonth(), 1)
  );

  function clicar(dia: Date) {
    if (!inicio || (inicio && fim)) {
      setInicio(dia);
      setFim(null);
    } else if (chave(dia) < chave(inicio)) {
      setInicio(dia);
    } else {
      setFim(dia);
    }
  }

  function aplicar() {
    if (!inicio || !fim) return;
    setAberto(false);
    router.push(`/relatorios?de=${iso(inicio)}&ate=${iso(fim)}`);
  }

  // Limites de destaque, com prévia ao passar o mouse.
  const ref =
    fim ?? (inicio && hover && chave(hover) >= chave(inicio) ? hover : null);

  function papel(dia: Date): "unico" | "inicio" | "fim" | "entre" | "normal" {
    if (!inicio) return "normal";
    const k = chave(dia);
    const kLo = chave(inicio);
    const kHi = ref ? chave(ref) : kLo;
    if (kLo === kHi) return k === kLo ? "unico" : "normal";
    if (k === kLo) return "inicio";
    if (k === kHi) return "fim";
    if (k > kLo && k < kHi) return "entre";
    return "normal";
  }

  function Mes({ ano, mes }: { ano: number; mes: number }) {
    return (
      <div className="w-full">
        <div className="text-center text-sm font-semibold mb-2">
          {MESES[mes]} {ano}
        </div>
        <div className="grid grid-cols-7 text-center text-xs text-muted mb-1">
          {DIAS_SEMANA.map((d, i) => (
            <div key={i} className="py-1">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {celulas(ano, mes).map((dia, i) => {
            if (!dia) return <div key={i} className="h-9" />;
            const p = papel(dia);
            const ponta = p === "inicio" || p === "fim" || p === "unico";
            const banda =
              p === "entre"
                ? "bg-primary/15"
                : p === "inicio"
                  ? "bg-primary/15 rounded-l-full"
                  : p === "fim"
                    ? "bg-primary/15 rounded-r-full"
                    : "";
            return (
              <button
                key={i}
                type="button"
                onClick={() => clicar(dia)}
                onMouseEnter={() => setHover(dia)}
                className={`h-9 text-sm flex items-center justify-center ${banda}`}
              >
                <span
                  className={`h-8 w-8 flex items-center justify-center rounded-full ${
                    ponta
                      ? "bg-primary text-primary-foreground font-semibold"
                      : "hover:bg-background"
                  }`}
                >
                  {dia.getDate()}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const proximo = new Date(mesBase.getFullYear(), mesBase.getMonth() + 1, 1);
  const label = inicio && fim ? `${fmt(inicio)} – ${fmt(fim)}` : "Selecionar no calendário";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium border ${
          ativo
            ? "bg-primary text-primary-foreground border-primary"
            : "bg-card text-muted border-border hover:border-primary"
        }`}
      >
        📅 {label}
      </button>

      {aberto && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setAberto(false)} />
          <div
            className="absolute left-0 z-50 mt-2 rounded-xl border border-border bg-card p-4 shadow-2xl w-[19rem] sm:w-[40rem]"
            onMouseLeave={() => setHover(null)}
          >
            {/* Navegação */}
            <div className="flex items-center justify-between mb-2">
              <button
                type="button"
                onClick={() =>
                  setMesBase(new Date(mesBase.getFullYear(), mesBase.getMonth() - 1, 1))
                }
                className="h-8 w-8 rounded-lg text-muted hover:bg-background text-lg leading-none"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={() =>
                  setMesBase(new Date(mesBase.getFullYear(), mesBase.getMonth() + 1, 1))
                }
                className="h-8 w-8 rounded-lg text-muted hover:bg-background text-lg leading-none"
              >
                ›
              </button>
            </div>

            {/* Meses */}
            <div className="flex gap-6">
              <Mes ano={mesBase.getFullYear()} mes={mesBase.getMonth()} />
              <div className="hidden sm:block w-full">
                <Mes ano={proximo.getFullYear()} mes={proximo.getMonth()} />
              </div>
            </div>

            {/* Rodapé */}
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
              <span className="text-xs text-muted">
                {inicio && !fim
                  ? "Agora escolha a data final"
                  : inicio && fim
                    ? `${fmt(inicio)} até ${fmt(fim)}`
                    : "Escolha a data inicial"}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAberto(false)}
                  className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted hover:bg-background"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={aplicar}
                  disabled={!inicio || !fim}
                  className="rounded-lg bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-40"
                >
                  Aplicar
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
