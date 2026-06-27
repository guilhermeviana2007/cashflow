"use client";

import { useOptimistic, useTransition } from "react";
import Link from "next/link";
import { formatBRL } from "@/lib/format";
import { excluirLancamentoById } from "./actions";

type LancamentoItem = {
  id: string;
  tipo: "ENTRADA" | "SAIDA";
  descricao: string;
  fornecedor: string | null;
  valorCentavos: number;
  taxaDescontadaCentavos: number;
  dataFormatada: string;
  categoriaNome: string | null;
};

export function TabelaLancamentos({ lancamentos: inicial }: { lancamentos: LancamentoItem[] }) {
  const [lancamentos, removeOptimistic] = useOptimistic(
    inicial,
    (state, id: string) => state.filter((l) => l.id !== id)
  );
  const [, startTransition] = useTransition();

  function handleDelete(id: string) {
    startTransition(async () => {
      removeOptimistic(id);
      await excluirLancamentoById(id);
    });
  }

  if (lancamentos.length === 0) {
    return (
      <div className="p-10 text-center text-muted">
        Nenhum lançamento ainda.{" "}
        <Link href="/lancamentos/novo" className="text-primary underline">
          Criar o primeiro
        </Link>
      </div>
    );
  }

  return (
    <table className="w-full text-sm">
      <thead className="bg-background text-muted">
        <tr>
          <th className="text-left font-medium px-2 sm:px-4 py-3">Data</th>
          <th className="text-left font-medium px-2 sm:px-4 py-3">Descrição</th>
          <th className="text-left font-medium px-2 sm:px-4 py-3 hidden sm:table-cell">Categoria</th>
          <th className="text-right font-medium px-2 sm:px-4 py-3">Valor</th>
          <th className="px-2 sm:px-4 py-3"></th>
        </tr>
      </thead>
      <tbody>
        {lancamentos.map((l) => {
          const valorEfetivo =
            l.tipo === "ENTRADA"
              ? l.valorCentavos - l.taxaDescontadaCentavos
              : l.valorCentavos;
          return (
            <tr key={l.id} className="border-t border-border">
              <td className="px-2 sm:px-4 py-3 whitespace-nowrap text-muted">{l.dataFormatada}</td>
              <td className="px-2 sm:px-4 py-3">
                <span className={l.tipo === "ENTRADA" ? "text-primary" : "text-danger"}>
                  {l.tipo === "ENTRADA" ? "↑" : "↓"}
                </span>{" "}
                {l.descricao}
                {l.fornecedor && <span className="text-muted"> · {l.fornecedor}</span>}
              </td>
              <td className="px-2 sm:px-4 py-3 hidden sm:table-cell text-muted">
                {l.categoriaNome ?? "—"}
              </td>
              <td
                className={`px-2 sm:px-4 py-3 text-right font-medium whitespace-nowrap tabular-nums ${
                  l.tipo === "ENTRADA" ? "text-primary" : "text-danger"
                }`}
              >
                {l.tipo === "ENTRADA" ? "+" : "−"}
                {formatBRL(valorEfetivo)}
                {l.taxaDescontadaCentavos > 0 && (
                  <div className="text-xs text-muted font-normal leading-tight mt-0.5">
                    bruto {formatBRL(l.valorCentavos)} · taxa −
                    {formatBRL(l.taxaDescontadaCentavos)}
                  </div>
                )}
              </td>
              <td className="px-2 sm:px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-3">
                  <Link
                    href={`/lancamentos/${l.id}/editar`}
                    className="text-muted hover:text-primary"
                    title="Editar"
                  >
                    ✎
                  </Link>
                  <button
                    onClick={() => handleDelete(l.id)}
                    className="text-muted hover:text-danger"
                    title="Excluir"
                  >
                    ✕
                  </button>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
