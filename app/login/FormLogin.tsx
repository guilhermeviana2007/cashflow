"use client";

import { useState } from "react";
import { useActionState } from "react";
import Link from "next/link";
import { entrar, type EstadoAuth } from "./actions";

function IconeOlho({ aberto }: { aberto: boolean }) {
  return aberto ? (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}

export function FormLogin() {
  const [estado, formAction, pending] = useActionState<EstadoAuth, FormData>(entrar, {});
  const [mostrarSenha, setMostrarSenha] = useState(false);

  return (
    <form action={formAction} className="space-y-4">
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-muted">Email</span>
        <input name="email" type="email" required autoComplete="email" className="inp-auth" />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-muted">Senha</span>
        <div className="relative">
          <input
            name="senha"
            type={mostrarSenha ? "text" : "password"}
            required
            autoComplete="current-password"
            className="inp-auth pr-10"
          />
          <button
            type="button"
            onClick={() => setMostrarSenha((v) => !v)}
            tabIndex={-1}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors"
            aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
          >
            <IconeOlho aberto={mostrarSenha} />
          </button>
        </div>
      </label>

      {estado.erro && (
        <div className="rounded-lg border border-danger/40 bg-danger/5 p-3 text-sm text-danger">
          {estado.erro}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="btn w-full rounded-lg bg-primary px-4 py-3 font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Entrando..." : "Entrar"}
      </button>

      <p className="text-center text-sm text-muted">
        Não tem conta?{" "}
        <Link href="/cadastro" className="text-primary underline">
          Criar agora
        </Link>
      </p>
    </form>
  );
}
