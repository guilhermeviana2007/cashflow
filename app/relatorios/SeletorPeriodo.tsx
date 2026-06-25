"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

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
  const [de, setDe] = useState(deInicial);
  const [ate, setAte] = useState(ateInicial);

  function aplicarCustom() {
    if (!de || !ate) return;
    router.push(`/relatorios?de=${de}&ate=${ate}`);
  }

  const ativo = "bg-foreground text-background border-foreground";
  const inativo = "bg-card text-muted border-border hover:border-foreground";

  return (
    <div className="space-y-3 mb-6">
      {/* Presets */}
      <div className="flex flex-wrap gap-2">
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
      </div>

      {/* Período personalizado por calendário */}
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-3">
        <span className="text-sm font-medium text-muted w-full sm:w-auto">
          Período personalizado:
        </span>
        <label className="block">
          <span className="mb-1 block text-xs text-muted">De</span>
          <input
            type="date"
            value={de}
            max={ate || undefined}
            onChange={(e) => setDe(e.target.value)}
            className="inp-rel"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-muted">Até</span>
          <input
            type="date"
            value={ate}
            min={de || undefined}
            onChange={(e) => setAte(e.target.value)}
            className="inp-rel"
          />
        </label>
        <button
          onClick={aplicarCustom}
          disabled={!de || !ate}
          className={`rounded-lg px-4 py-2 text-sm font-semibold border disabled:opacity-40 ${
            atual === "custom"
              ? "bg-primary text-primary-foreground border-primary"
              : "border-border hover:border-primary text-foreground"
          }`}
        >
          Aplicar
        </button>
      </div>

      <style>{`
        .inp-rel {
          border: 1px solid var(--border);
          background: var(--background);
          color: var(--foreground);
          border-radius: 0.5rem;
          padding: 0.45rem 0.6rem;
          font-size: 0.9rem;
          outline: none;
        }
        .inp-rel:focus { border-color: var(--primary); }
      `}</style>
    </div>
  );
}
