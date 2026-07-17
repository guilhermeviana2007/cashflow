"use client";

import { useState } from "react";
import { criarConvite, excluirConvite, marcarLido } from "./actions";
import {
  PLANOS,
  ROTULO_PLANO,
  ROTULO_SERVICO,
  ORDEM_CRITICIDADE,
  servicosPermitidos,
  type Pendencia,
  type Plano,
  type Servico,
} from "@/lib/onboarding/tipos";

export type ConviteView = {
  id: string;
  token: string;
  nomeCliente: string;
  emailCliente: string;
  plano: string;
  servicos: string[];
  criadoEm: string;
  expiraEm: string;
  expirado: boolean;
  resposta: {
    id: string;
    lido: boolean;
    enviadoEm: string;
    aceiteNome: string;
    aceiteCargo: string;
    pendencias: Pendencia[];
    respostas: Record<string, Record<string, unknown>>;
  } | null;
};

const ICONE: Record<Pendencia["criticidade"], string> = {
  bloqueante: "🔴",
  atencao: "⚠️",
  normal: "⬜",
};

export function PainelOnboarding({
  convites,
  baseUrl,
}: {
  convites: ConviteView[];
  baseUrl: string;
}) {
  return (
    <div>
      <NovoConvite baseUrl={baseUrl} />
      <h2 className="mb-3 mt-8 font-semibold">Convites gerados</h2>
      {convites.length === 0 ? (
        <p className="text-sm text-muted">Nenhum convite ainda.</p>
      ) : (
        <div className="space-y-2">
          {convites.map((c) => (
            <Linha key={c.id} c={c} baseUrl={baseUrl} />
          ))}
        </div>
      )}
    </div>
  );
}

// --- gerar convite -----------------------------------------------------------

function NovoConvite({ baseUrl }: { baseUrl: string }) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [plano, setPlano] = useState<Plano>("ENTRADA");
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [gerado, setGerado] = useState("");

  const disponiveis = servicosPermitidos(plano);

  function trocarPlano(p: Plano) {
    setPlano(p);
    // Rebaixar de Premium tem que largar os serviços que só existem lá,
    // senão o servidor recusa e o admin não entende por quê.
    setServicos((atual) => atual.filter((s) => servicosPermitidos(p).includes(s)));
  }

  async function gerar() {
    setErro("");
    setSalvando(true);
    const r = await criarConvite({ nomeCliente: nome, emailCliente: email, plano, servicos });
    setSalvando(false);
    if (!r.ok) {
      setErro(r.mensagem);
      return;
    }
    setGerado(`${baseUrl}/onboarding/${r.token}`);
    setNome("");
    setEmail("");
    setServicos([]);
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h2 className="mb-1 font-semibold">Gerar link de onboarding</h2>
      <p className="mb-4 text-sm text-muted">
        O plano e os serviços que você marcar aqui são o que o cliente vai ver — ele confirma, não
        escolhe. Link vale 30 dias.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs text-muted">Nome do cliente</span>
          <input className="inp-admin" value={nome} onChange={(e) => setNome(e.target.value)} />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-muted">E-mail do cliente</span>
          <input
            className="inp-admin"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
      </div>

      <div className="mt-4">
        <span className="mb-1.5 block text-xs text-muted">Plano</span>
        <div className="flex flex-wrap gap-2">
          {PLANOS.map((p) => (
            <button
              key={p}
              type="button"
              data-ativo={plano === p}
              onClick={() => trocarPlano(p)}
              className="pill rounded-lg border px-3 py-1.5 text-sm data-[ativo=true]:border-primary data-[ativo=true]:bg-primary data-[ativo=true]:text-primary-foreground data-[ativo=false]:border-border data-[ativo=false]:text-muted"
            >
              {ROTULO_PLANO[p]}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <span className="mb-1.5 block text-xs text-muted">Serviços contratados</span>
        <div className="flex flex-col gap-1.5">
          {disponiveis.map((s) => (
            <label key={s} className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="accent-[var(--primary)]"
                checked={servicos.includes(s)}
                onChange={(e) =>
                  setServicos((a) => (e.target.checked ? [...a, s] : a.filter((x) => x !== s)))
                }
              />
              {ROTULO_SERVICO[s]}
            </label>
          ))}
        </div>
        {plano !== "PREMIUM" && (
          <p className="mt-2 text-xs text-muted">
            Sistema interno e Google Ads só aparecem no plano Premium.
          </p>
        )}
      </div>

      {erro && <p className="mt-3 text-sm text-danger">{erro}</p>}

      <button
        type="button"
        onClick={gerar}
        disabled={salvando}
        className="btn mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
      >
        {salvando ? "Gerando…" : "Gerar link"}
      </button>

      {gerado && (
        <div className="mt-4 rounded-lg border border-primary/40 bg-primary/5 p-3">
          <p className="mb-1.5 text-xs text-muted">Link gerado — mande para o cliente:</p>
          <Copiavel texto={gerado} />
        </div>
      )}
    </div>
  );
}

function Copiavel({ texto }: { texto: string }) {
  const [copiado, setCopiado] = useState(false);
  return (
    <div className="flex items-center gap-2">
      <code className="flex-1 break-all text-xs">{texto}</code>
      <button
        type="button"
        className="btn shrink-0 rounded border border-border px-2 py-1 text-xs"
        onClick={async () => {
          await navigator.clipboard.writeText(texto);
          setCopiado(true);
          setTimeout(() => setCopiado(false), 1500);
        }}
      >
        {copiado ? "✓" : "Copiar"}
      </button>
    </div>
  );
}

// --- linha da lista ----------------------------------------------------------

function Linha({ c, baseUrl }: { c: ConviteView; baseUrl: string }) {
  const [aberto, setAberto] = useState(false);
  const r = c.resposta;

  const bloqueantes = r?.pendencias.filter((p) => p.criticidade === "bloqueante").length ?? 0;

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center gap-3 p-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-medium">{c.nomeCliente}</span>
            {r && !r.lido && (
              <span className="shrink-0 rounded bg-primary px-1.5 py-0.5 text-[0.65rem] font-bold text-primary-foreground">
                NOVO
              </span>
            )}
          </div>
          <div className="mt-0.5 truncate text-xs text-muted">
            {ROTULO_PLANO[c.plano as Plano] ?? c.plano} ·{" "}
            {c.servicos.map((s) => ROTULO_SERVICO[s as Servico] ?? s).join(", ")}
          </div>
        </div>

        <div className="shrink-0 text-right text-xs">
          {r ? (
            <>
              <div className="text-primary">Respondido</div>
              <div className="text-muted">{r.enviadoEm}</div>
            </>
          ) : c.expirado ? (
            <div className="text-danger">Expirado</div>
          ) : (
            <div className="text-muted">Aguardando</div>
          )}
        </div>

        <button
          type="button"
          onClick={() => setAberto((a) => !a)}
          className="btn shrink-0 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted"
        >
          {aberto ? "Fechar" : "Abrir"}
        </button>
      </div>

      {aberto && (
        <div className="border-t border-border p-4">
          {!r && (
            <div className="mb-4">
              <p className="mb-1.5 text-xs text-muted">Link do cliente:</p>
              <Copiavel texto={`${baseUrl}/onboarding/${c.token}`} />
              <p className="mt-2 text-xs text-muted">
                Expira em {c.expiraEm} · gerado em {c.criadoEm}
              </p>
            </div>
          )}

          {r && (
            <>
              <div className="mb-4 text-xs text-muted">
                Assinado por <strong className="text-foreground">{r.aceiteNome}</strong> (
                {r.aceiteCargo})
              </div>

              <h4 className="mb-2 text-sm font-semibold">
                Pendências
                {bloqueantes > 0 && <span className="ml-2 text-danger">{bloqueantes} bloqueante(s)</span>}
              </h4>
              {r.pendencias.length === 0 ? (
                <p className="mb-4 text-sm text-muted">Nenhuma.</p>
              ) : (
                <ul className="mb-4 space-y-1.5">
                  {[...r.pendencias]
                    .sort(
                      (a, b) => ORDEM_CRITICIDADE[a.criticidade] - ORDEM_CRITICIDADE[b.criticidade]
                    )
                    .map((p, i) => (
                      <li key={i} className="flex gap-2 text-sm">
                        <span aria-hidden>{ICONE[p.criticidade]}</span>
                        <span className="flex-1">{p.texto}</span>
                        <span className="text-xs text-muted">{p.responsavel}</span>
                      </li>
                    ))}
                </ul>
              )}

              <h4 className="mb-2 text-sm font-semibold">Respostas</h4>
              <div className="space-y-2">
                {Object.entries(r.respostas).map(([etapa, campos]) => (
                  <details key={etapa} className="rounded-lg border border-border px-3 py-2">
                    <summary className="cursor-pointer text-sm font-medium select-none">
                      {etapa}
                    </summary>
                    <dl className="mt-2 space-y-1 border-t border-border pt-2">
                      {Object.entries(campos ?? {}).map(([k, v]) => (
                        <div key={k} className="grid grid-cols-[8rem_1fr] gap-2 text-xs">
                          <dt className="truncate text-muted">{k}</dt>
                          <dd className="break-words whitespace-pre-wrap">
                            {typeof v === "object" ? JSON.stringify(v) : String(v)}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </details>
                ))}
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => marcarLido(r.id, !r.lido)}
                  className="btn rounded-lg border border-border px-3 py-1.5 text-xs"
                >
                  {r.lido ? "Marcar como não lido" : "Marcar como lido"}
                </button>
                <a
                  href={`/admin/onboarding/${c.id}/pdf`}
                  className="btn rounded-lg border border-border px-3 py-1.5 text-xs"
                >
                  Exportar PDF
                </a>
              </div>
            </>
          )}

          <button
            type="button"
            onClick={() => {
              if (confirm(`Excluir o onboarding de ${c.nomeCliente}? Isso apaga as respostas.`)) {
                void excluirConvite(c.id);
              }
            }}
            className="btn mt-4 text-xs text-danger"
          >
            Excluir convite e respostas
          </button>
        </div>
      )}
    </div>
  );
}
