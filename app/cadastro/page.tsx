import { redirect } from "next/navigation";
import { getUsuarioAtual } from "@/lib/auth";
import { FormCadastro } from "./FormCadastro";

export default async function CadastroPage() {
  if (await getUsuarioAtual()) redirect("/");

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="text-2xl font-bold text-primary">🍔 CaixaFood</div>
          <p className="text-muted text-sm mt-1">Crie sua conta grátis</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <FormCadastro />
        </div>
      </div>
    </div>
  );
}
