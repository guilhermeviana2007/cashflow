export default function Loading() {
  return (
    <div className="space-y-6 max-w-2xl animate-pulse">
      <div className="h-8 w-40 bg-border rounded" />
      <div className="rounded-xl border border-border bg-card p-5 h-48" />
      <div className="rounded-xl border border-border bg-card p-5 h-64" />
      <div className="rounded-xl border border-border bg-card p-5 h-40" />
    </div>
  );
}
