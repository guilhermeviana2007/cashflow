"use client";

import { useState } from "react";
import { FormLancamento } from "./FormLancamento";
import { ImportadorNota } from "@/app/lancamentos/importar/ImportadorNota";

type Categoria = { id: string; nome: string; tipo: string };
type FormaPgto = { slug: string; nome: string; percentualCentesimos: number };

export function NovoLancamento({
  categorias,
  formasPagamento,
}: {
  categorias: Categoria[];
  formasPagamento: FormaPgto[];
}) {
  const [aba, setAba] = useState<"manual" | "foto">("manual");

  const categoriasSaida = categorias
    .filter((c) => c.tipo === "SAIDA")
    .map((c) => ({ id: c.id, nome: c.nome }));

  return (
    <div className="max-w-lg">
      {/* Abas */}
      <div className="grid grid-cols-2 gap-2 mb-6">
        <button
          onClick={() => setAba("manual")}
          className={`rounded-lg px-4 py-2.5 text-sm font-semibold border ${
            aba === "manual"
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-card text-muted border-border hover:border-primary"
          }`}
        >
          ✍️ Manual
        </button>
        <button
          onClick={() => setAba("foto")}
          className={`rounded-lg px-4 py-2.5 text-sm font-semibold border ${
            aba === "foto"
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-card text-muted border-border hover:border-primary"
          }`}
        >
          📸 Foto da nota (IA)
        </button>
      </div>

      {aba === "manual" ? (
        <FormLancamento categorias={categorias} formasPagamento={formasPagamento} />
      ) : (
        <div>
          <p className="text-sm text-muted mb-4">
            Tire uma foto da nota/cupom e a IA preenche a saída para você conferir.
          </p>
          <ImportadorNota categorias={categoriasSaida} />
        </div>
      )}
    </div>
  );
}
