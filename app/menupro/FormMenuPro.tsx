"use client";

import { useRef, useState } from "react";
import { enviarFormularioMenuPro } from "./actions";

export function FormMenuPro() {
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);
  const enviandoRef = useRef(false);

  if (enviado) {
    return (
      <div className="text-center py-10">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-2xl font-bold text-white mb-2">Recebemos suas informações!</h2>
        <p className="text-white/70">
          Nossa equipe vai analisar e entrar em contato em breve pelo telefone informado.
          Obrigado por escolher a <span className="text-[#E2231A] font-semibold">MenuPro</span>.
        </p>
      </div>
    );
  }

  return (
    <form
      action={async (fd) => {
        if (enviandoRef.current) return;
        enviandoRef.current = true;
        setEnviando(true);
        setErro(null);
        const r = await enviarFormularioMenuPro(fd);
        if (r.ok) {
          setEnviado(true);
        } else {
          setErro(r.mensagem);
          setEnviando(false);
          enviandoRef.current = false;
        }
      }}
      className="space-y-8"
    >
      {/* Dados do responsável */}
      <Secao titulo="Dados do responsável" numero={1}>
        <Campo label="Nome completo do responsável" obrigatorio>
          <input name="nomeResponsavel" required className="campo" placeholder="Seu nome" />
        </Campo>
        <div className="grid sm:grid-cols-2 gap-4">
          <Campo label="Telefone de contato" obrigatorio>
            <input
              name="telefone"
              required
              type="tel"
              inputMode="tel"
              className="campo"
              placeholder="(11) 99999-9999"
            />
          </Campo>
          <Campo label="E-mail" obrigatorio>
            <input
              name="email"
              required
              type="email"
              className="campo"
              placeholder="seu@email.com"
            />
          </Campo>
        </div>
      </Secao>

      {/* Dados do estabelecimento */}
      <Secao titulo="Seu estabelecimento" numero={2}>
        <div className="grid sm:grid-cols-2 gap-4">
          <Campo label="Nome do estabelecimento" obrigatorio>
            <input
              name="nomeEstabelecimento"
              required
              className="campo"
              placeholder="Ex: Burger do Zé"
            />
          </Campo>
          <Campo label="CNPJ">
            <input name="cnpj" className="campo" placeholder="00.000.000/0000-00" />
          </Campo>
        </div>
        <Campo label="Quais marketplaces você trabalha hoje?">
          <input
            name="marketplaces"
            className="campo"
            placeholder="Ex: iFood, 99Food, Rappi..."
          />
        </Campo>
        <div className="grid sm:grid-cols-2 gap-4">
          <Campo label="Trabalha com mesas e comandas?">
            <SimNao name="trabalhaMesas" />
          </Campo>
          <Campo label="Trabalha com entrega própria?">
            <SimNao name="entregaPropria" />
          </Campo>
        </div>
      </Secao>

      {/* Acessos */}
      <Secao titulo="Acessos das plataformas" numero={3}>
        <p className="text-sm text-white/50 -mt-2 mb-2">
          Precisamos dos acessos para estruturar e editar seu cardápio. Preencha os que você possui.
        </p>
        <ParLoginSenha titulo="Cardápio Digital" base="cardapio" />
        <ParLoginSenha titulo="iFood" base="ifood" />
        <ParLoginSenha titulo="99Food" base="noveNove" />
      </Secao>

      {/* Operação atual */}
      <Secao titulo="Sua operação hoje" numero={4}>
        <Campo label="Já possui sistema de organização financeira / fluxo de caixa?">
          <input
            name="sistemaFinanceiro"
            className="campo"
            placeholder="Ex: Sim, uso planilha / Não tenho / Uso o sistema X"
          />
        </Campo>
        <Campo label="Quais são seus canais de atendimento atuais?">
          <textarea
            name="canaisAtendimento"
            rows={2}
            className="campo resize-none"
            placeholder="Ex: WhatsApp, Instagram, telefone, balcão..."
          />
        </Campo>
        <Campo label="Você tem foto de todos os seus produtos?">
          <SimNao name="temFotos" comParcial />
        </Campo>
      </Secao>

      {erro && (
        <div className="rounded-lg border border-[#E2231A]/50 bg-[#E2231A]/10 p-3 text-sm text-[#ff6b6b]">
          {erro}
        </div>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="btn w-full rounded-xl bg-[#E2231A] px-6 py-4 font-bold text-white text-lg hover:bg-[#c41d15] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {enviando ? (
          <>
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            Enviando...
          </>
        ) : (
          "Enviar informações"
        )}
      </button>

      <p className="text-center text-xs text-white/40">
        Seus dados são usados apenas para a estruturação do seu cardápio.
      </p>
    </form>
  );
}

function Secao({
  titulo,
  numero,
  children,
}: {
  titulo: string;
  numero: number;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6 space-y-4">
      <div className="flex items-center gap-3 mb-1">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#E2231A] text-sm font-bold text-white">
          {numero}
        </span>
        <h2 className="font-bold text-white text-lg">{titulo}</h2>
      </div>
      {children}
    </section>
  );
}

function Campo({
  label,
  obrigatorio,
  children,
}: {
  label: string;
  obrigatorio?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-white/80">
        {label}
        {obrigatorio && <span className="text-[#E2231A]"> *</span>}
      </span>
      {children}
    </label>
  );
}

function ParLoginSenha({ titulo, base }: { titulo: string; base: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/30 p-4">
      <p className="text-sm font-semibold text-white mb-3">{titulo}</p>
      <div className="grid sm:grid-cols-2 gap-3">
        <input
          name={`${base}Login`}
          className="campo"
          placeholder="Login / e-mail"
          autoComplete="off"
        />
        <input
          name={`${base}Senha`}
          className="campo"
          placeholder="Senha"
          autoComplete="off"
        />
      </div>
    </div>
  );
}

function SimNao({ name, comParcial }: { name: string; comParcial?: boolean }) {
  const opcoes = comParcial ? ["Sim", "Não", "Parcial"] : ["Sim", "Não"];
  return (
    <div className={`grid gap-2 ${comParcial ? "grid-cols-3" : "grid-cols-2"}`}>
      {opcoes.map((op) => (
        <label key={op} className="relative cursor-pointer">
          <input type="radio" name={name} value={op} className="peer sr-only" />
          <span className="pill flex items-center justify-center rounded-lg border border-white/15 bg-black/30 px-3 py-2.5 text-sm font-medium text-white/70 peer-checked:border-[#E2231A] peer-checked:bg-[#E2231A] peer-checked:text-white">
            {op}
          </span>
        </label>
      ))}
    </div>
  );
}
