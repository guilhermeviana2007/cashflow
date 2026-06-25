"use client";

import { useActionState } from "react";
import Link from "next/link";
import { cadastrar, type EstadoAuth } from "@/app/login/actions";

const TIPOS = [
  { v: "hamburgueria", l: "Hamburgueria" },
  { v: "pizzaria", l: "Pizzaria" },
  { v: "lanchonete", l: "Lanchonete" },
  { v: "acaiteria", l: "Açaiteria" },
  { v: "outro", l: "Outro" },
];

export function FormCadastro() {
  const [estado, formAction, pending] = useActionState<EstadoAuth, FormData>(
    cadastrar,
    {}
  );

  return (
    <form action={formAction} className="space-y-4">
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-muted">
          Nome do estabelecimento
        </span>
        <input name="nome" required placeholder="Ex: Burger do João" className="inp-auth" />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-muted">Tipo</span>
        <select name="tipo" defaultValue="hamburgueria" className="inp-auth">
          {TIPOS.map((t) => (
            <option key={t.v} value={t.v}>
              {t.l}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-muted">Email</span>
        <input name="email" type="email" required autoComplete="email" className="inp-auth" />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-muted">Senha</span>
          <input
            name="senha"
            type="password"
            required
            autoComplete="new-password"
            className="inp-auth"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-muted">Repetir senha</span>
          <input
            name="confirmar"
            type="password"
            required
            autoComplete="new-password"
            className="inp-auth"
          />
        </label>
      </div>

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
        {pending ? "Criando conta..." : "Criar conta"}
      </button>

      <p className="text-center text-sm text-muted">
        Já tem conta?{" "}
        <Link href="/login" className="text-primary underline">
          Entrar
        </Link>
      </p>
    </form>
  );
}
