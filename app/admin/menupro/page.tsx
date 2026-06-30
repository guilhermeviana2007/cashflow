import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatData } from "@/lib/format";
import { ListaFormularios } from "./ListaFormularios";

export default async function AdminMenuProPage() {
  const registros = await prisma.formularioMenuPro.findMany({
    orderBy: { createdAt: "desc" },
  });

  const naoLidos = registros.filter((r) => !r.lido).length;

  const formularios = registros.map((r) => ({
    ...r,
    createdAt: formatData(r.createdAt),
  }));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold mb-1">Formulários MenuPro</h1>
          <p className="text-muted text-sm">
            Cadastros recebidos pelo formulário público de cardápio digital.
          </p>
        </div>
        <Link
          href="/admin"
          className="shrink-0 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted hover:bg-card"
        >
          ← Voltar
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="text-xs text-muted mb-1">Total recebidos</div>
          <div className="text-xl font-bold">{registros.length}</div>
        </div>
        <div className="rounded-xl border border-primary/40 bg-primary/5 p-5">
          <div className="text-xs text-muted mb-1">Novos (não lidos)</div>
          <div className="text-xl font-bold text-primary">{naoLidos}</div>
        </div>
      </div>

      <ListaFormularios formularios={formularios} />
    </div>
  );
}
