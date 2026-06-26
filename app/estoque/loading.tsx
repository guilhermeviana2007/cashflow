export default function Loading() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-7 w-32 bg-card rounded-lg mb-1" />
      <div className="h-4 w-72 bg-card rounded mb-6" />
      <div className="rounded-xl border border-border bg-card p-4 h-16" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-4 h-28" />
        ))}
      </div>
    </div>
  );
}
