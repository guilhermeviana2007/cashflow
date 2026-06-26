"use client";

import { CalendarioRange } from "./CalendarioRange";

export function SeletorPeriodo({
  atual,
  deInicial,
  ateInicial,
}: {
  atual: string;
  deInicial: string;
  ateInicial: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <span className="text-sm font-medium text-muted">Período:</span>
      <CalendarioRange
        key={`${deInicial}-${ateInicial}`}
        deInicial={deInicial}
        ateInicial={ateInicial}
        ativo={atual === "custom"}
      />
    </div>
  );
}
