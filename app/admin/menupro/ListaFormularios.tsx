"use client";

import { useState } from "react";
import { marcarLido, excluirFormulario } from "./actions";

type Formulario = {
  id: string;
  nomeResponsavel: string;
  telefone: string;
  email: string;
  cnpj: string;
  telefoneLoja: string | null;
  nomeEstabelecimento: string;
  marketplaces: string;
  trabalhaMesas: string;
  entregaPropria: string;
  horarioFuncionamento: string | null;
  taxaEntrega: string | null;
  cep: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  formasPagamento: string | null;
  cardapioLogin: string | null;
  cardapioSenha: string | null;
  ifoodLogin: string | null;
  ifoodSenha: string | null;
  noveNoveLogin: string | null;
  noveNoveSenha: string | null;
  sistemaFinanceiro: string | null;
  canaisAtendimento: string | null;
  temFotos: string;
  lido: boolean;
  createdAt: string;
};

export function ListaFormularios({ formularios }: { formularios: Formulario[] }) {
  const [abertos, setAbertos] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setAbertos((prev) => {
      const novo = new Set(prev);
      if (novo.has(id)) novo.delete(id);
      else novo.add(id);
      return novo;
    });
  }

  if (formularios.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted">
        Nenhum formulário recebido ainda.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {formularios.map((f) => {
        const aberto = abertos.has(f.id);
        return (
          <div
            key={f.id}
            className={`rounded-xl border bg-card p-4 ${
              f.lido ? "border-border" : "border-primary/50"
            }`}
          >
            {/* Cabeçalho clicável */}
            <button
              onClick={() => toggle(f.id)}
              className="flex w-full items-start justify-between gap-3 text-left"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold truncate">{f.nomeEstabelecimento}</span>
                  {!f.lido && (
                    <span className="shrink-0 rounded-full bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary">
                      Novo
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted truncate">
                  {f.nomeResponsavel} · {f.telefone}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-muted">{f.createdAt}</span>
                <span className="text-muted">{aberto ? "▲" : "▼"}</span>
              </div>
            </button>

            {/* Detalhes */}
            {aberto && (
              <div className="mt-4 space-y-4 border-t border-border pt-4">
                <Grupo titulo="Contato">
                  <Linha rotulo="Responsável" valor={f.nomeResponsavel} />
                  <Linha rotulo="Tel. pessoal" valor={f.telefone} copiavel />
                  {f.telefoneLoja && <Linha rotulo="Tel. da loja" valor={f.telefoneLoja} copiavel />}
                  <Linha rotulo="E-mail" valor={f.email} copiavel />
                  <Linha rotulo="CNPJ" valor={f.cnpj || "—"} copiavel={!!f.cnpj} />
                </Grupo>

                {(f.cep || f.logradouro || f.cidade) && (
                  <Grupo titulo="Endereço">
                    {f.logradouro && (
                      <Linha rotulo="Logradouro" valor={`${f.logradouro}${f.numero ? ", " + f.numero : ""}${f.complemento ? " – " + f.complemento : ""}`} />
                    )}
                    {f.bairro && <Linha rotulo="Bairro" valor={f.bairro} />}
                    {f.cidade && <Linha rotulo="Cidade / UF" valor={`${f.cidade}${f.estado ? " – " + f.estado : ""}`} />}
                    {f.cep && <Linha rotulo="CEP" valor={f.cep} />}
                  </Grupo>
                )}

                {f.horarioFuncionamento && (
                  <Grupo titulo="Horário de funcionamento">
                    {f.horarioFuncionamento.split(" | ").map((linha) => {
                      const [dia, horario] = linha.split(": ");
                      return <Linha key={dia} rotulo={dia} valor={horario ?? "—"} />;
                    })}
                  </Grupo>
                )}

                <Grupo titulo="Operação">
                  <Linha rotulo="Marketplaces" valor={f.marketplaces || "—"} />
                  <Linha rotulo="Mesas/comandas" valor={f.trabalhaMesas} />
                  <Linha rotulo="Entrega própria" valor={f.entregaPropria} />
                  <Linha rotulo="Taxa de entrega" valor={f.taxaEntrega || "—"} />
                  <Linha rotulo="Formas de pagamento" valor={f.formasPagamento || "—"} />
                  <Linha rotulo="Sistema financeiro" valor={f.sistemaFinanceiro || "—"} />
                  <Linha rotulo="Canais de atendimento" valor={f.canaisAtendimento || "—"} />
                  <Linha rotulo="Tem fotos dos produtos" valor={f.temFotos} />
                </Grupo>

                <Grupo titulo="🔑 Acessos das plataformas">
                  <ParCredencial titulo="Cardápio Digital" login={f.cardapioLogin} senha={f.cardapioSenha} />
                  <ParCredencial titulo="iFood" login={f.ifoodLogin} senha={f.ifoodSenha} />
                  <ParCredencial titulo="99Food" login={f.noveNoveLogin} senha={f.noveNoveSenha} />
                </Grupo>

                {/* Ações */}
                <div className="flex flex-wrap gap-2 pt-2">
                  <a
                    href={`https://wa.me/55${f.telefone.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
                  >
                    💬 WhatsApp
                  </a>
                  <button
                    onClick={() => marcarLido(f.id, !f.lido)}
                    className="btn rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted hover:bg-background"
                  >
                    {f.lido ? "Marcar como não lido" : "Marcar como lido"}
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("Excluir este formulário permanentemente?")) {
                        excluirFormulario(f.id);
                      }
                    }}
                    className="btn rounded-lg border border-danger/40 px-4 py-2 text-sm font-medium text-danger hover:bg-danger/10"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Grupo({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">{titulo}</p>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function Linha({ rotulo, valor, copiavel }: { rotulo: string; valor: string; copiavel?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="text-muted shrink-0">{rotulo}</span>
      <div className="flex items-center gap-2 text-right">
        <span className="font-medium break-all">{valor}</span>
        {copiavel && <BotaoCopiar texto={valor} />}
      </div>
    </div>
  );
}

function ParCredencial({
  titulo,
  login,
  senha,
}: {
  titulo: string;
  login: string | null;
  senha: string | null;
}) {
  if (!login && !senha) {
    return (
      <div className="rounded-lg border border-border bg-background p-2.5 text-sm">
        <span className="font-medium">{titulo}:</span>{" "}
        <span className="text-muted">não informado</span>
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-border bg-background p-2.5 text-sm space-y-1">
      <p className="font-medium">{titulo}</p>
      <div className="flex items-center justify-between gap-2">
        <span className="text-muted">Login</span>
        <div className="flex items-center gap-2">
          <span className="font-mono break-all">{login || "—"}</span>
          {login && <BotaoCopiar texto={login} />}
        </div>
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-muted">Senha</span>
        <div className="flex items-center gap-2">
          <span className="font-mono break-all">{senha || "—"}</span>
          {senha && <BotaoCopiar texto={senha} />}
        </div>
      </div>
    </div>
  );
}

function BotaoCopiar({ texto }: { texto: string }) {
  const [copiado, setCopiado] = useState(false);
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(texto);
        setCopiado(true);
        setTimeout(() => setCopiado(false), 1500);
      }}
      className="shrink-0 rounded px-1.5 py-0.5 text-xs text-primary hover:bg-primary/10"
      title="Copiar"
    >
      {copiado ? "✓" : "⧉"}
    </button>
  );
}
