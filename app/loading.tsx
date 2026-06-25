export default function Loading() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-2">
          <div className="h-7 w-36 bg-card rounded-lg" />
          <div className="h-4 w-24 bg-card rounded" />
        </div>
        <div className="flex gap-1.5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-8 w-16 bg-card rounded-lg" />
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 mb-4 h-24" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5 h-20" />
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card p-5 mb-6 h-56" />
      <div className="rounded-xl border border-border bg-card p-5 h-56" />
    </div>
  );
}
