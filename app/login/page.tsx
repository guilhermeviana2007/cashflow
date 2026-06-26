import { redirect } from "next/navigation";
import { getUsuarioAtual } from "@/lib/auth";
import { FormLogin } from "./FormLogin";
import { LogoVertical } from "@/app/components/LogoCashFlow";

export default async function LoginPage() {
  if (await getUsuarioAtual()) redirect("/dashboard");

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="rounded-xl border border-border bg-card p-8 mb-4">
          <div className="flex justify-center mb-6">
            <LogoVertical />
          </div>
          <div className="text-center">
            <p className="text-xl font-semibold text-primary">Consciência é lucro.</p>
            <p className="text-sm text-muted mt-1">Entre na sua conta</p>
          </div>
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
