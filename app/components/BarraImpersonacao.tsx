import { sairVisualizacao } from "@/app/login/actions";

// Faixa fixa no topo enquanto um admin visualiza a conta de um cliente.
// Cor distinta (índigo) para deixar claro que não é a conta do próprio admin.
export function BarraImpersonacao({ email }: { email: string }) {
  return (
    <div className="w-full bg-indigo-600 text-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2 text-sm">
        <span className="flex items-center gap-2 truncate">
          <span>👁️</span>
          <span className="truncate">
            Visualizando como cliente: <strong>{email}</strong>
          </span>
        </span>
        <form action={sairVisualizacao}>
          <button
            type="submit"
            className="shrink-0 rounded-lg bg-white/20 px-3 py-1.5 font-semibold hover:bg-white/30"
          >
            Sair da visualização
          </button>
        </form>
      </div>
    </div>
  );
}
