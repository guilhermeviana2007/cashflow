"use client";

import { useActionState, useState } from "react";
import {
  salvarPerfil,
  alterarSenha,
  salvarContato,
  enviarVerificacao,
  type EstadoConta,
} from "./actions";

type Props = {
  nome: string;
  fotoPerfil: string | null;
  email: string;
  telefone: string;
  emailRecuperacao: string;
  emailVerificado: boolean;
  temaInicial: "claro" | "escuro";
  assinatura: {
    planoLabel: string;
    valorFmt: string;
    vencimentoFmt: string;
    situacaoLabel: string;
    situacaoCls: string;
    ativa: boolean;
  };
};

type Aba = "assinatura" | "perfil" | "seguranca";

const ABAS: { id: Aba; label: string; icon: string }[] = [
  { id: "assinatura", label: "Assinatura", icon: "💳" },
  { id: "perfil", label: "Perfil", icon: "👤" },
  { id: "seguranca", label: "Segurança", icon: "🔒" },
];

function Aviso({ estado }: { estado: EstadoConta }) {
  if (estado.erro)
    return (
      <div className="rounded-lg border border-danger/40 bg-danger/10 p-3 text-sm text-danger">
        {estado.erro}
      </div>
    );
  if (estado.ok && estado.msg)
    return (
      <div className="rounded-lg border border-primary/40 bg-primary/10 p-3 text-sm text-primary">
        ✓ {estado.msg}
      </div>
    );
  return null;
}

export function MinhaConta(props: Props) {
  const [aba, setAba] = useState<Aba>("assinatura");
  const [foto, setFoto] = useState<string | null>(props.fotoPerfil);
  const [tema, setTema] = useState<"claro" | "escuro">(props.temaInicial);

  const [estPerfil, actPerfil, pendPerfil] = useActionState<EstadoConta, FormData>(
    salvarPerfil,
    {}
  );
  const [estSenha, actSenha, pendSenha] = useActionState<EstadoConta, FormData>(
    alterarSenha,
    {}
  );
  const [estContato, actContato, pendContato] = useActionState<EstadoConta, FormData>(
    salvarContato,
    {}
  );
  const [estVerif, actVerif, pendVerif] = useActionState<EstadoConta, FormData>(
    enviarVerificacao,
    {}
  );

  function aplicarTema(t: "claro" | "escuro") {
    document.cookie = `caixafood_tema=${t};path=/;max-age=31536000`;
    if (t === "claro") document.documentElement.setAttribute("data-tema", "claro");
    else document.documentElement.removeAttribute("data-tema");
    setTema(t);
  }

  function aoEscolherFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 256;
        const escala = Math.min(max / img.width, max / img.height, 1);
        const w = Math.round(img.width * escala);
        const h = Math.round(img.height * escala);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        canvas.getContext("2d")?.drawImage(img, 0, 0, w, h);
        setFoto(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  const inicial = (props.nome || props.email).charAt(0).toUpperCase();

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-1">Minha conta</h1>
      <p className="text-muted mb-6 truncate">{props.email}</p>

      {/* Abas */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {ABAS.map((a) => (
          <button
            key={a.id}
            onClick={() => setAba(a.id)}
            className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium border ${
              aba === a.id
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted border-border hover:border-primary"
            }`}
          >
            <span className="mr-1">{a.icon}</span>
            {a.label}
          </button>
        ))}
      </div>

      {/* ===== ASSINATURA ===== */}
      {aba === "assinatura" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Sua assinatura</h2>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${props.assinatura.situacaoCls}`}
              >
                {props.assinatura.situacaoLabel}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <DadoGrande titulo="Plano" valor={props.assinatura.planoLabel} />
              <DadoGrande titulo="Valor" valor={props.assinatura.valorFmt} />
              <DadoGrande titulo="Próximo vencimento" valor={props.assinatura.vencimentoFmt} />
            </div>
          </div>
          <p className="text-xs text-muted px-1">
            Os pagamentos são confirmados pelo suporte. Em caso de dúvida sobre cobrança,
            fale com a gente.
          </p>
        </div>
      )}

      {/* ===== PERFIL ===== */}
      {aba === "perfil" && (
        <div className="space-y-6">
          <form action={actPerfil} className="rounded-xl border border-border bg-card p-5 space-y-4">
            <h2 className="font-semibold">Perfil do estabelecimento</h2>

            {/* Foto */}
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full border border-border bg-background flex items-center justify-center">
                {foto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={foto} alt="Foto de perfil" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-3xl font-bold text-muted">{inicial}</span>
                )}
              </div>
              <div className="space-y-2">
                <label className="block">
                  <span className="rounded-lg border border-border px-3 py-2 text-sm font-medium cursor-pointer hover:bg-background inline-block">
                    Escolher foto
                  </span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={aoEscolherFoto}
                    className="hidden"
                  />
                </label>
                {foto && (
                  <button
                    type="button"
                    onClick={() => setFoto(null)}
                    className="block text-xs text-muted hover:text-danger"
                  >
                    Remover foto
                  </button>
                )}
              </div>
            </div>
            <input type="hidden" name="fotoPerfil" value={foto ?? ""} />

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-muted">
                Nome do estabelecimento
              </span>
              <input name="nome" required defaultValue={props.nome} className="inp-conta" />
            </label>

            <Aviso estado={estPerfil} />
            <button
              type="submit"
              disabled={pendPerfil}
              className="btn rounded-lg bg-primary px-5 py-2.5 font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {pendPerfil ? "Salvando..." : "Salvar perfil"}
            </button>
          </form>

          {/* Tema */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="font-semibold mb-1">Tema do sistema</h2>
            <p className="text-sm text-muted mb-4">Escolha entre o modo escuro e claro.</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => aplicarTema("escuro")}
                className={`rounded-lg border-2 p-4 text-left ${
                  tema === "escuro" ? "border-primary" : "border-border"
                }`}
              >
                <div className="h-10 rounded-md bg-[#0e1311] border border-[#242c27] mb-2" />
                <span className="text-sm font-medium">🌙 Escuro</span>
              </button>
              <button
                type="button"
                onClick={() => aplicarTema("claro")}
                className={`rounded-lg border-2 p-4 text-left ${
                  tema === "claro" ? "border-primary" : "border-border"
                }`}
              >
                <div className="h-10 rounded-md bg-[#f6f8f7] border border-[#e2e8e4] mb-2" />
                <span className="text-sm font-medium">☀️ Claro</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== SEGURANÇA ===== */}
      {aba === "seguranca" && (
        <div className="space-y-6">
          {/* Senha */}
          <form action={actSenha} className="rounded-xl border border-border bg-card p-5 space-y-4">
            <h2 className="font-semibold">Alterar senha</h2>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-muted">Senha atual</span>
              <input name="senhaAtual" type="password" required className="inp-conta" />
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-muted">Nova senha</span>
                <input name="novaSenha" type="password" required className="inp-conta" />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-muted">Confirmar</span>
                <input name="confirmar" type="password" required className="inp-conta" />
              </label>
            </div>
            <Aviso estado={estSenha} />
            <button
              type="submit"
              disabled={pendSenha}
              className="btn rounded-lg bg-primary px-5 py-2.5 font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {pendSenha ? "Alterando..." : "Alterar senha"}
            </button>
          </form>

          {/* Contato + recuperação */}
          <form action={actContato} className="rounded-xl border border-border bg-card p-5 space-y-4">
            <h2 className="font-semibold">Contato e recuperação</h2>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-muted">
                Número de celular
              </span>
              <input
                name="telefone"
                type="tel"
                inputMode="tel"
                defaultValue={props.telefone}
                placeholder="(11) 99999-9999"
                className="inp-conta"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-muted">
                E-mail de recuperação
                {props.emailRecuperacao &&
                  (props.emailVerificado ? (
                    <span className="ml-2 text-xs text-primary">✓ verificado</span>
                  ) : (
                    <span className="ml-2 text-xs text-amber-500">não verificado</span>
                  ))}
              </span>
              <input
                name="emailRecuperacao"
                type="email"
                defaultValue={props.emailRecuperacao}
                placeholder="outro@email.com"
                className="inp-conta"
              />
              <p className="mt-1.5 text-xs text-muted">
                Usado para recuperar o acesso caso esqueça a senha. A verificação é opcional.
              </p>
            </label>

            <Aviso estado={estContato} />
            <button
              type="submit"
              disabled={pendContato}
              className="btn rounded-lg bg-primary px-5 py-2.5 font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {pendContato ? "Salvando..." : "Salvar"}
            </button>
          </form>

          {/* Verificação do e-mail */}
          {props.emailRecuperacao && !props.emailVerificado && (
            <form action={actVerif} className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-5 space-y-3">
              <h2 className="font-semibold">Verificar e-mail de recuperação</h2>
              <p className="text-sm text-muted">
                Enviaremos um link de confirmação para{" "}
                <strong className="text-foreground">{props.emailRecuperacao}</strong>. Verificar
                deixa a recuperação de senha mais segura (opcional).
              </p>
              <Aviso estado={estVerif} />
              <button
                type="submit"
                disabled={pendVerif}
                className="rounded-lg border border-amber-500/50 px-5 py-2.5 font-semibold text-amber-500 hover:bg-amber-500/10 disabled:opacity-50"
              >
                {pendVerif ? "Enviando..." : "Enviar link de confirmação"}
              </button>
            </form>
          )}
        </div>
      )}

    </div>
  );
}

function DadoGrande({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div>
      <div className="text-xs text-muted mb-1">{titulo}</div>
      <div className="text-lg font-bold">{valor}</div>
    </div>
  );
}
