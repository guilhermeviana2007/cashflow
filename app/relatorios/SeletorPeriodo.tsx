"use client";

import { useRouter } from "next/navigation";
import { CalendarioRange } from "./CalendarioRange";

export const PRESETS = [
  { id: "este-mes", label: "Este mês" },
  { id: "mes-passado", label: "Mês passado" },
  { id: "7d", label: "Últimos 7 dias" },
  { id: "14d", label: "Últimos 14 dias" },
  { id: "3m", label: "Últimos 3 meses" },
];

export function SeletorPeriodo({
  atual,
  deInicial,
  ateInicial,
}: {
  atual: string;
  deInicial: string;
  ateInicial: string;
}) {
  const router = useRouter();
  const ativo = "bg-foreground text-background border-foreground";
  const inativo = "bg-card text-muted border-border hover:border-foreground";

  return (
    <div className="flex flex-wrap items-center gap-2 mb-6">
      {PRESETS.map((p) => (
        <button
          key={p.id}
          onClick={() => router.push(`/relatorios?p=${p.id}`)}
          className={`rounded-full px-4 py-1.5 text-sm font-medium border ${
            atual === p.id ? ativo : inativo
          }`}
        >
          {p.label}
        </button>
      ))}

      <CalendarioRange
        key={`${deInicial}-${ateInicial}`}
        deInicial={deInicial}
        ateInicial={ateInicial}
        ativo={atual === "custom"}
      />
    </div>
  );
}
