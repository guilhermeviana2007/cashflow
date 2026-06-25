import { redirect } from "next/navigation";
import { getUsuarioAtual } from "@/lib/auth";
import { FormLogin } from "./FormLogin";

export default async function LoginPage() {
  // Já logado? Vai direto pro dashboard.
  if (await getUsuarioAtual()) redirect("/");

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="text-2xl font-bold text-primary">🍔 CaixaFood</div>
          <p className="text-muted text-sm mt-1">Entre na sua conta</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <FormLogin />
        </div>
        <p className="mt-4 text-center text-xs text-muted">
          Conta de teste: demo@caixafood.com / demo1234
        </p>
      </div>
    </div>
  );
}
