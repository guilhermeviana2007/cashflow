"use client";

import { useState } from "react";
import {
  registrarPagamento,
  pausarAssinatura,
  reativarAssinatura,
  editarAssinatura,
  removerConta,
  verComoCliente,
} from "./actions";

const PLANOS = [
  { v: "MENSAL", l: "Mensal" },
  { v: "TRIMESTRAL", l: "Trimestral" },
  { v: "ANUAL", l: "Anual" },
];

type Props = {
  usuarioId: string;
  email: string;
  assinaturaId: string;
  status: string; // ATIVA | PAUSADA | CANCELADA
  valorReais: string; // "49,90"
  plano: string;
  vencimentoISO: string; // "2026-07-25"
  podeGerenciar: boolean; // false em contas de administrador
};

function BotaoConfirmar({
  mensagem,
  className,
  children,
}: {
  mensagem: string;
  className: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(e) => {
        if (!confirm(mensagem)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}

export function AcoesCliente(props: Props) {
  const [editando, setEditando] = useState(false);
  const pausada = props.status === "PAUSADA" || props.status === "CANCELADA";

  if (!props.podeGerenciar) {
    return (
      <span className="text-xs text-muted italic">Conta de administrador</span>
    );
  }

  const btn =
    "rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-background";

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <form action={registrarPagamento}>
          <input type="hidden" name="assinaturaId" value={props.assinaturaId} />
          <BotaoConfirmar
            mensagem="Registrar pagamento e estender o vencimento conforme o plano?"
            className={`${btn} border-primary/40 text-primary`}
          >
            💳 Pagamento
          </BotaoConfirmar>
        </form>

        {pausada ? (
          <form action={reativarAssinatura}>
            <input type="hidden" name="usuarioId" value={props.usuarioId} />
            <BotaoConfirmar
              mensagem="Reativar o acesso desta conta?"
              className={`${btn} border-primary/40 text-primary`}
            >
              ▶ Reativar
            </BotaoConfirmar>
          </form>
        ) : (
          <form action={pausarAssinatura}>
            <input type="hidden" name="usuarioId" value={props.usuarioId} />
            <BotaoConfirmar
              mensagem="Pausar esta conta? O cliente perde o acesso até ser reativado."
              className={`${btn} border-amber-500/40 text-amber-500`}
            >
              ⏸ Pausar
            </BotaoConfirmar>
          </form>
        )}

        <form action={verComoCliente}>
          <input type="hidden" name="usuarioId" value={props.usuarioId} />
          <button type="submit" className={btn}>
            👁️ Ver como cliente
          </button>
        </form>

        <button type="button" onClick={() => setEditando(true)} className={btn}>
          ✏️ Editar
        </button>

        <form action={removerConta}>
          <input type="hidden" name="usuarioId" value={props.usuarioId} />
          <BotaoConfirmar
            mensagem={`REMOVER a conta ${props.email}? Esta ação apaga TODOS os dados do cliente e não pode ser desfeita.`}
            className={`${btn} border-danger/40 text-danger`}
          >
            🗑️ Remover
          </BotaoConfirmar>
        </form>
      </div>

      {/* Modal de edição */}
      {editando && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setEditando(false)}
        >
          <div
            className="w-full max-w-sm rounded-xl border border-border bg-card p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-semibold mb-1">Editar assinatura</h3>
            <p className="text-xs text-muted mb-4 truncate">{props.email}</p>

            <form
              action={editarAssinatura}
              onSubmit={() => setEditando(false)}
              className="space-y-3"
            >
              <input type="hidden" name="usuarioId" value={props.usuarioId} />

              <label className="block">
                <span className="mb-1 block text-xs font-medium text-muted">
                  Valor da mensalidade (R$)
                </span>
                <input
                  name="valor"
                  inputMode="decimal"
                  defaultValue={props.valorReais}
                  placeholder="0,00"
                  className="inp-admin"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-medium text-muted">Plano</span>
                <select name="plano" defaultValue={props.plano} className="inp-admin">
                  {PLANOS.map((p) => (
                    <option key={p.v} value={p.v}>
                      {p.l}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-medium text-muted">
                  Próximo vencimento
                </span>
                <input
                  name="proximoVencimento"
                  type="date"
                  defaultValue={props.vencimentoISO}
                  className="inp-admin"
                />
              </label>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setEditando(false)}
                  className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted hover:bg-background"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>

          <style>{`
            .inp-admin {
              width: 100%;
              border: 1px solid var(--border);
              background: var(--background);
              color: var(--foreground);
              border-radius: 0.5rem;
              padding: 0.5rem 0.6rem;
              font-size: 0.9rem;
              outline: none;
            }
            .inp-admin:focus { border-color: var(--primary); }
            input[type="date"].inp-admin { color-scheme: dark; }
          `}</style>
        </div>
      )}
    </>
  );
}
