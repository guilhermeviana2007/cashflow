"use client";

import { useState } from "react";
import { criarProduto, editarProduto, excluirProduto, atualizarQuantidade } from "./actions";

export type Produto = {
  id: string;
  nome: string;
  tipo: string; // INDUSTRIALIZADO | INSUMO
  unidade: string;
  quantidadeAtual: number;
  quantidadeIdeal: number;
};

const UNIDADES = ["un", "kg", "g", "L", "ml", "cx", "pct", "fardo", "garrafa", "lata"];

function abaixo(p: Produto) {
  return p.quantidadeIdeal > 0 && p.quantidadeAtual < p.quantidadeIdeal;
}
function numStr(n: number) {
  return Number.isInteger(n) ? String(n) : String(n).replace(".", ",");
}

export function EstoqueLista({ produtos }: { produtos: Produto[] }) {
  const [adicionando, setAdicionando] = useState(false);
  const [editando, setEditando] = useState<Produto | null>(null);

  const indinstrializados = produtos.filter((p) => p.tipo !== "INSUMO");
  const insumos = produtos.filter((p) => p.tipo === "INSUMO");
  const emFalta = produtos.filter(abaixo);

  return (
    <div>
      {/* Aviso de estoque baixo */}
      {emFalta.length > 0 ? (
        <div className="rounded-xl border-2 border-amber-500 bg-amber-500/10 p-4 mb-6">
          <p className="font-bold text-amber-500 mb-2">
            ⚠️ {emFalta.length} {emFalta.length === 1 ? "item está" : "itens estão"} abaixo do
            estoque ideal
          </p>
          <ul className="text-sm space-y-0.5">
            {emFalta.map((p) => (
              <li key={p.id} className="flex justify-between gap-3">
                <span>{p.nome}</span>
                <span className="text-muted">
                  tem {numStr(p.quantidadeAtual)} · ideal {numStr(p.quantidadeIdeal)} ·{" "}
                  <strong className="text-amber-500">
                    faltam {numStr(p.quantidadeIdeal - p.quantidadeAtual)} {p.unidade}
                  </strong>
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        produtos.length > 0 && (
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 mb-6 text-sm text-primary">
            ✓ Tudo em ordem — nenhum item abaixo do estoque ideal.
          </div>
        )
      )}

      <div className="flex justify-end mb-4">
        <button
          onClick={() => setAdicionando(true)}
          className="btn rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground hover:opacity-90"
        >
          + Adicionar item
        </button>
      </div>

      {produtos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted">
          Nenhum item cadastrado ainda. Comece adicionando seus produtos e insumos.
        </div>
      ) : (
        <div className="space-y-8">
          <Secao titulo="🥤 Produtos industrializados" itens={indinstrializados} onEditar={setEditando} />
          <Secao titulo="🥩 Insumos" itens={insumos} onEditar={setEditando} />
        </div>
      )}

      {adicionando && (
        <ModalProduto titulo="Adicionar item" onFechar={() => setAdicionando(false)} acao={criarProduto} />
      )}
      {editando && (
        <ModalProduto
          titulo="Editar item"
          produto={editando}
          onFechar={() => setEditando(null)}
          acao={editarProduto}
        />
      )}
    </div>
  );
}

function Secao({
  titulo,
  itens,
  onEditar,
}: {
  titulo: string;
  itens: Produto[];
  onEditar: (p: Produto) => void;
}) {
  if (itens.length === 0) return null;
  return (
    <div>
      <h2 className="font-semibold mb-3">{titulo}</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {itens.map((p) => (
          <LinhaProduto key={p.id} produto={p} onEditar={onEditar} />
        ))}
      </div>
    </div>
  );
}

function LinhaProduto({
  produto,
  onEditar,
}: {
  produto: Produto;
  onEditar: (p: Produto) => void;
}) {
  const [qtd, setQtd] = useState(numStr(produto.quantidadeAtual));
  const baixo = abaixo(produto);

  function ajustar(delta: number) {
    const atual = Number(qtd.replace(",", ".")) || 0;
    const novo = Math.max(0, atual + delta);
    setQtd(numStr(novo));
  }

  return (
    <div
      className={`rounded-xl border p-4 ${
        baixo ? "border-amber-500/50 bg-amber-500/5" : "border-border bg-card"
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0">
          <div className="font-semibold truncate">{produto.nome}</div>
          <div className="text-xs text-muted">
            ideal: {numStr(produto.quantidadeIdeal)} {produto.unidade}
            {baixo && <span className="text-amber-500 font-medium"> · abaixo do ideal</span>}
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <button onClick={() => onEditar(produto)} className="text-muted hover:text-primary" title="Editar">
            ✎
          </button>
          <form action={excluirProduto}>
            <input type="hidden" name="id" value={produto.id} />
            <button
              type="submit"
              className="text-muted hover:text-danger"
              title="Remover"
              onClick={(e) => {
                if (!confirm(`Remover "${produto.nome}" do estoque?`)) e.preventDefault();
              }}
            >
              ✕
            </button>
          </form>
        </div>
      </div>

      {/* Contagem do dia */}
      <form action={atualizarQuantidade} className="flex items-center gap-2">
        <input type="hidden" name="id" value={produto.id} />
        <button
          type="button"
          onClick={() => ajustar(-1)}
          className="h-10 w-10 shrink-0 rounded-lg border border-border text-lg font-bold hover:bg-background"
        >
          −
        </button>
        <input
          name="quantidadeAtual"
          inputMode="decimal"
          value={qtd}
          onChange={(e) => setQtd(e.target.value)}
          className="h-10 w-20 text-center rounded-lg border border-border bg-background text-foreground font-semibold outline-none focus:border-primary"
        />
        <button
          type="button"
          onClick={() => ajustar(1)}
          className="h-10 w-10 shrink-0 rounded-lg border border-border text-lg font-bold hover:bg-background"
        >
          +
        </button>
        <span className="text-sm text-muted w-10">{produto.unidade}</span>
        <button
          type="submit"
          className="btn ml-auto h-10 rounded-lg bg-primary px-4 font-semibold text-primary-foreground hover:opacity-90"
        >
          Salvar
        </button>
      </form>
    </div>
  );
}

function ModalProduto({
  titulo,
  produto,
  onFechar,
  acao,
}: {
  titulo: string;
  produto?: Produto;
  onFechar: () => void;
  acao: (fd: FormData) => void | Promise<void>;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onFechar}
    >
      <div
        className="w-full max-w-sm rounded-xl border border-border bg-card p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-semibold mb-4">{titulo}</h3>
        <form
          action={acao}
          onSubmit={() => onFechar()}
          className="space-y-3"
        >
          {produto && <input type="hidden" name="id" value={produto.id} />}

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted">Nome do item</span>
            <input
              name="nome"
              required
              defaultValue={produto?.nome}
              placeholder="Ex: Coca-Cola lata 350ml"
              className="inp-est"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted">Tipo</span>
              <select name="tipo" defaultValue={produto?.tipo ?? "INDUSTRIALIZADO"} className="inp-est">
                <option value="INDUSTRIALIZADO">Industrializado</option>
                <option value="INSUMO">Insumo</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted">Unidade</span>
              <input
                name="unidade"
                list="unidades-estoque"
                defaultValue={produto?.unidade ?? "un"}
                className="inp-est"
              />
              <datalist id="unidades-estoque">
                {UNIDADES.map((u) => (
                  <option key={u} value={u} />
                ))}
              </datalist>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted">Quantidade atual</span>
              <input
                name="quantidadeAtual"
                inputMode="decimal"
                defaultValue={produto ? numStr(produto.quantidadeAtual) : "0"}
                className="inp-est"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted">Mínimo ideal</span>
              <input
                name="quantidadeIdeal"
                inputMode="decimal"
                defaultValue={produto ? numStr(produto.quantidadeIdeal) : "0"}
                placeholder="Ex: 20"
                className="inp-est"
              />
            </label>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onFechar}
              className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted hover:bg-background"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
