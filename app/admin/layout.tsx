import { exigirAdmin } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await exigirAdmin();
  return (
    <div>
      <div className="mb-6 pb-4 border-b border-border flex items-center gap-3">
        <span className="rounded-md bg-primary/10 border border-primary/30 px-2 py-0.5 text-xs font-semibold text-primary uppercase tracking-wider">
          Admin
        </span>
        <span className="text-muted text-sm">Painel de administração</span>
      </div>
      {children}
    </div>
  );
}
