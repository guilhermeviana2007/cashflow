"use client";

import { useActionState } from "react";
import Link from "next/link";
import { entrar, type EstadoAuth } from "./actions";

export function FormLogin() {
  const [estado, formAction, pending] = useActionState<EstadoAuth, FormData>(
    entrar,
    {}
  );

  return (
    <form action={formAction} className="space-y-4">
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-muted">Email</span>
        <input name="email" type="email" required autoComplete="email" className="inp-auth" />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-muted">Senha</span>
        <input
          name="senha"
          type="password"
          required
          autoComplete="current-password"
          className="inp-auth"
        />
      </label>

      {estado.erro && (
        <div className="rounded-lg border border-danger/40 bg-danger/5 p-3 text-sm text-danger">
          {estado.erro}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-primary px-4 py-3 font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
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
