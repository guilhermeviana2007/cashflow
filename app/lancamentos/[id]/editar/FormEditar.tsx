"use client";

import { useState } from "react";
import { editarLancamento } from "@/app/lancamentos/actions";
import { reaisParaCentavos, formatBRL } from "@/lib/format";

type Categoria = { id: string; nome: string; tipo: string };
type FormaPgto = { slug: string; nome: string; percentualCentesimos: number };

type LancamentoInit = {
  id: string;
  tipo: "ENTRADA" | "SAIDA";
  descricao: string;
  valor: string;
  data: string;
  categoriaId: string;
  fornecedor: string;
  formaPagamento: string;
};

export function FormEditar({
  lancamento,
  categorias,
  formasPagamento,
}: {
  lancamento: LancamentoInit;
  categorias: Categoria[];
  formasPagamento: FormaPgto[];
}) {
  const [tipo, setTipo] = useState<"ENTRADA" | "SAIDA">(lancamento.tipo);
  const [formaSelecionada, setFormaSelecionada] = useState(lancamento.formaPagamento);
  const [valorTexto, setValorTexto] = useState(lancamento.valor);
  const [enviando, setEnviando] = useState(false);

  const categoriasFiltradas = categorias.filter((c) => c.tipo === tipo);

  const taxaDaForma = formasPagamento.find((f) => f.slug === formaSelecionada);
  const valorCentavos = reaisParaCentavos(valorTexto);
  const taxaCentavos =
    tipo === "ENTRADA" && taxaDaForma && taxaDaForma.percentualCentesimos > 0
      ? Math.round((valorCentavos * taxaDaForma.percentualCentesimos) / 10000)
      : 0;
  const liquidoCentavos = valorCentavos - taxaCentavos;

  return (
    <form
      action={async (fd) => {
        setEnviando(true);
        await editarLancamento(fd);
      }}
      className="space-y-5 max-w-lg"
    >
      <input type="hidden" name="id" value={lancamento.id} />
      <input type="hidden" name="tipo" value={tipo} />

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setTipo("ENTRADA")}
          className={`rounded-lg border px-4 py-3 font-semibold transition-colors ${
            tipo === "ENTRADA"
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-card text-foreground hover:border-primary"
          }`}
        >
          ↑ Entrada (venda)
        </button>
        <button
          type="button"
          onClick={() => setTipo("SAIDA")}
          className={`rounded-lg border px-4 py-3 font-semibold transition-colors ${
            tipo === "SAIDA"
              ? "border-danger bg-danger text-white"
              : "border-border bg-card text-foreground hover:border-danger"
          }`}
        >
          ↓ Saída (compra/despesa)
        </button>
      </div>

      <Campo label="Descrição *">
        <input name="descricao" required defaultValue={lancamento.descricao} className="input" />
      </Campo>

      <div className="grid grid-cols-2 gap-3">
        <Campo label="Valor (R$) *">
          <input
            name="valor"
            required
            inputMode="decimal"
            defaultValue={lancamento.valor}
            className="input"
            onChange={(e) => setValorTexto(e.target.value)}
          />
        </Campo>
        <Campo label="Data">
          <input name="data" type="date" defaultValue={lancamento.data} className="input" />
        </Campo>
      </div>

      <Campo label="Categoria">
        <select name="categoriaId" className="input" defaultValue={lancamento.categoriaId}>
          <option value="">— Sem categoria —</option>
          {categoriasFiltradas.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
      </Campo>

      <div className="grid grid-cols-2 gap-3">
        <Campo label={tipo === "ENTRADA" ? "Canal / Cliente" : "Fornecedor"}>
          <input name="fornecedor" defaultValue={lancamento.fornecedor} className="input" />
        </Campo>
        <Campo label="Forma de pagamento">
          <select
            name="formaPagamento"
            className="input"
            defaultValue={lancamento.formaPagamento}
            onChange={(e) => setFormaSelecionada(e.target.value)}
          >
            <option value="">—</option>
            {formasPagamento.map((f) => (
              <option key={f.slug} value={f.slug}>
                {f.nome}
                {f.percentualCentesimos > 0
                  ? ` (${(f.percentualCentesimos / 100).toFixed(1).replace(".", ",")}%)`
                  : ""}
              </option>
            ))}
          </select>
        </Campo>
      </div>

      {/* Preview de taxa */}
      {tipo === "ENTRADA" && taxaDaForma && taxaDaForma.percentualCentesimos > 0 && (
        <div className="rounded-lg border border-border bg-card p-3 text-sm space-y-1.5">
          {valorCentavos > 0 ? (
            <>
              <div className="flex justify-between">
                <span className="text-muted">Valor bruto</span>
                <span>{formatBRL(valorCentavos)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">
                  Taxa{" "}
                  {(taxaDaForma.percentualCentesimos / 100).toFixed(2).replace(".", ",")}%
                </span>
                <span className="text-danger">−{formatBRL(taxaCentavos)}</span>
              </div>
              <div className="flex justify-between font-semibold border-t border-border pt-1.5">
                <span>Você receberá</span>
                <span className="text-primary">{formatBRL(liquidoCentavos)}</span>
              </div>
            </>
          ) : (
            <p className="text-xs text-muted">
              Taxa de{" "}
              {(taxaDaForma.percentualCentesimos / 100).toFixed(2).replace(".", ",")}%
              será recalculada ao salvar.
            </p>
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="w-full rounded-lg bg-primary px-4 py-3 font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
      >
        {enviando ? "Salvando..." : "Salvar alterações"}
      </button>

      <style>{`
        .input {
          width: 100%;
          border: 1px solid var(--border);
          background: var(--background);
          color: var(--foreground);
          border-radius: 0.5rem;
          padding: 0.6rem 0.75rem;
          font-size: 0.95rem;
          outline: none;
        }
        .input:focus { border-color: var(--primary); }
      `}</style>
    </form>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-muted">{label}</span>
      {children}
    </label>
  );
}
