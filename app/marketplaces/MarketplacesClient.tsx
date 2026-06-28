"use client";

import { useRef, useState } from "react";
import { salvarMarketplaces, adicionarMarketplaceCustom, registrarRepasse, excluirRepasse } from "./actions";
import { formatBRL } from "@/lib/format";

type Marketplace = { id: string; nome: string; ativo: boolean };
type Repasse = {
  id: string;
  descricao: string;
  valorCentavos: number;
  data: Date;
  fornecedor: string | null;
};

const ICONES: Record<string, string> = {
  "iFood": "🛵",
  "99Food": "🛵",
  "Rappi": "🎒",
  "Uber Eats": "🟢",
  "Zé Delivery": "🍺",
};

export function MarketplacesClient({
  sugeridos,
  marketplaces,
  repasses,
}: {
  sugeridos: string[];
  marketplaces: Marketplace[];
  repasses: Repasse[];
}) {
  const [salvandoConfig, setSalvandoConfig] = useState(false);
  const [enviandoRepasse, setEnviandoRepasse] = useState(false);
  const [adicionando, setAdicionando] = useState(false);
  const repasseFormRef = useRef<HTMLFormElement>(null);
  const customFormRef = useRef<HTMLFormElement>(null);

  const ativos = marketplaces.filter((m) => m.ativo);
  const todosNomes = new Set(marketplaces.map((m) => m.nome));

  // Combina sugeridos + custom (já cadastrados mas não sugeridos)
  const todosParaExibir = [
    ...sugeridos,
    ...marketplaces.map((m) => m.nome).filter((n) => !sugeridos.includes(n)),
  ];

  const hoje = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6 max-w-2xl">

      {/* ── Configurar plataformas ───────────────────────────────────────── */}
      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-semibold mb-1">Suas plataformas</h2>
        <p className="text-sm text-muted mb-4">
          Marque quais plataformas de delivery você usa. Só as ativas aparecem no formulário de repasse.
        </p>

        <form
          action={async (fd) => {
            setSalvandoConfig(true);
            await salvarMarketplaces(fd);
            setSalvandoConfig(false);
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {todosParaExibir.map((nome) => {
              const ativo = marketplaces.find((m) => m.nome === nome)?.ativo ?? false;
              const icone = ICONES[nome] ?? "🛒";
              return (
                <label
                  key={nome}
                  className={`flex items-center gap-2.5 rounded-lg border p-3 cursor-pointer transition-colors ${
                    ativo
                      ? "border-primary bg-primary/5 text-foreground"
                      : "border-border bg-background text-muted"
                  }`}
                >
                  <input
                    type="checkbox"
                    name="marketplace"
                    value={nome}
                    defaultChecked={ativo}
                    className="accent-primary h-4 w-4 shrink-0"
                  />
                  <span className="text-base leading-none">{icone}</span>
                  <span className="text-sm font-medium leading-tight">{nome}</span>
                </label>
              );
            })}
          </div>

          <button
            type="submit"
            disabled={salvandoConfig}
            className="btn rounded-lg bg-primary px-5 py-2.5 font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {salvandoConfig ? "Salvando..." : "Salvar plataformas"}
          </button>
        </form>

        {/* Adicionar plataforma customizada */}
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs text-muted mb-2">Outra plataforma não listada?</p>
          <form
            ref={customFormRef}
            action={async (fd) => {
              setAdicionando(true);
              await adicionarMarketplaceCustom(fd);
              customFormRef.current?.reset();
              setAdicionando(false);
            }}
            className="flex gap-2"
          >
            <input
              name="nomeCustom"
              placeholder="Nome da plataforma"
              className="input flex-1 text-sm"
              required
            />
            <button
              type="submit"
              disabled={adicionando}
              className="btn rounded-lg border border-primary text-primary px-3 py-2 text-sm font-medium hover:bg-primary/5 disabled:opacity-50 shrink-0"
            >
              {adicionando ? "..." : "Adicionar"}
            </button>
          </form>
        </div>
      </section>

      {/* ── Registrar repasse ────────────────────────────────────────────── */}
      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-semibold mb-1">Registrar repasse</h2>
        <p className="text-sm text-muted mb-4">
          Informe o <strong>valor líquido</strong> que consta na aba Financeiro da plataforma.
          O valor entra direto no saldo do caixa.
        </p>

        {ativos.length === 0 ? (
          <p className="text-sm text-muted rounded-lg border border-border bg-background p-4 text-center">
            Ative ao menos uma plataforma acima para registrar repasses.
          </p>
        ) : (
          <form
            ref={repasseFormRef}
            action={async (fd) => {
              setEnviandoRepasse(true);
              await registrarRepasse(fd);
              repasseFormRef.current?.reset();
              setEnviandoRepasse(false);
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-3">
              <label className="block col-span-2 sm:col-span-1">
                <span className="mb-1.5 block text-sm font-medium text-muted">Plataforma *</span>
                <select name="marketplace" required className="input">
                  <option value="">— Selecione —</option>
                  {ativos.map((m) => (
                    <option key={m.id} value={m.nome}>
                      {ICONES[m.nome] ?? "🛒"} {m.nome}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block col-span-2 sm:col-span-1">
                <span className="mb-1.5 block text-sm font-medium text-muted">Valor líquido (R$) *</span>
                <input
                  name="valor"
                  required
                  inputMode="decimal"
                  placeholder="0,00"
                  className="input"
                />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-muted">Data do repasse *</span>
                <input name="data" type="date" defaultValue={hoje} required className="input" />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-muted">Período (opcional)</span>
                <input
                  name="periodo"
                  placeholder="Ex: 01/06 a 15/06"
                  className="input"
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={enviandoRepasse}
              className="btn w-full rounded-lg bg-primary px-4 py-3 font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {enviandoRepasse ? "Registrando..." : "Registrar repasse"}
            </button>
          </form>
        )}
      </section>

      {/* ── Histórico de repasses ────────────────────────────────────────── */}
      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-semibold mb-4">Histórico de repasses</h2>

        {repasses.length === 0 ? (
          <p className="text-sm text-muted text-center py-4">Nenhum repasse registrado ainda.</p>
        ) : (
          <div className="divide-y divide-border">
            {repasses.map((r) => (
              <div key={r.id} className="flex items-center justify-between py-3 gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{r.descricao}</p>
                  <p className="text-xs text-muted">
                    {r.data.toLocaleDateString("pt-BR")}
                    {r.fornecedor ? ` · ${r.fornecedor}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-semibold text-primary text-sm">
                    {formatBRL(r.valorCentavos)}
                  </span>
                  <form
                    action={excluirRepasse}
                    onSubmit={(e) => {
                      if (!confirm("Excluir este repasse?")) e.preventDefault();
                    }}
                  >
                    <input type="hidden" name="id" value={r.id} />
                    <button
                      type="submit"
                      className="text-xs text-muted hover:text-danger px-2 py-1 rounded hover:bg-danger/10 transition-colors"
                    >
                      Excluir
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
