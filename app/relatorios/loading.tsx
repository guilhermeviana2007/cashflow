export default function Loading() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-7 w-32 bg-card rounded-lg mb-1" />
      <div className="h-4 w-64 bg-card rounded mb-6" />
      <div className="rounded-xl border border-border bg-card p-5 h-80" />
    </div>
  );
}
