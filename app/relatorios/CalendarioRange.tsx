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

type Atalho = { label: string; de: Date; ate: Date };

function construirAtalhos(): Atalho[] {
  const hoje = new Date();
  const y = hoje.getFullYear();
  const m = hoje.getMonth();

  const ontem = new Date(hoje);
  ontem.setDate(hoje.getDate() - 1);
  const domSemana = new Date(hoje);
  domSemana.setDate(hoje.getDate() - hoje.getDay());
  const domSemPassada = new Date(domSemana);
  domSemPassada.setDate(domSemana.getDate() - 7);
  const sabSemPassada = new Date(domSemana);
  sabSemPassada.setDate(domSemana.getDate() - 1);

  const lista: Atalho[] = [
    { label: "Hoje", de: hoje, ate: hoje },
    { label: "Ontem", de: ontem, ate: ontem },
    { label: "Esta semana", de: domSemana, ate: hoje },
    { label: "Semana passada", de: domSemPassada, ate: sabSemPassada },
    { label: "Este mês", de: new Date(y, m, 1), ate: hoje },
    { label: "Mês passado", de: new Date(y, m - 1, 1), ate: new Date(y, m, 0) },
  ];
  for (let i = 2; i <= 4; i++) {
    const ini = new Date(y, m - i, 1);
    lista.push({
      label: `${MESES[ini.getMonth()]}/${ini.getFullYear()}`,
      de: ini,
      ate: new Date(y, m - i + 1, 0),
    });
  }
  for (const n of [2, 3, 6]) {
    const ini = new Date(hoje);
    ini.setMonth(ini.getMonth() - n);
    lista.push({ label: `Últimos ${n} meses`, de: ini, ate: hoje });
  }
  return lista;
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

  const atalhos = construirAtalhos();

  function irPara(de: Date, ate: Date) {
    setAberto(false);
    router.push(`/relatorios?de=${iso(de)}&ate=${iso(ate)}`);
  }

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
    irPara(inicio, fim);
  }

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
            className="absolute left-0 z-50 mt-2 flex rounded-xl border border-border bg-card p-3 shadow-2xl w-[21rem] sm:w-[46rem]"
            onMouseLeave={() => setHover(null)}
          >
            {/* Atalhos */}
            <div className="w-28 sm:w-40 shrink-0 overflow-y-auto max-h-[320px] border-r border-border pr-2 mr-3">
              {atalhos.map((a) => (
                <button
                  key={a.label}
                  type="button"
                  onClick={() => irPara(a.de, a.ate)}
                  className="block w-full text-left text-sm text-primary hover:bg-background rounded px-2 py-1.5"
                >
                  {a.label}
                </button>
              ))}
            </div>

            {/* Calendário */}
            <div className="flex-1">
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

              <div className="flex gap-6">
                <Mes ano={mesBase.getFullYear()} mes={mesBase.getMonth()} />
                <div className="hidden sm:block w-full">
                  <Mes ano={proximo.getFullYear()} mes={proximo.getMonth()} />
                </div>
              </div>

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
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
                    Fechar
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
          </div>
        </>
      )}
    </div>
  );
}
