export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-2">
          <div className="h-7 w-40 bg-card rounded-lg" />
          <div className="h-4 w-52 bg-card rounded" />
        </div>
        <div className="h-9 w-20 bg-card rounded-lg" />
      </div>

      <div className="rounded-xl border border-border bg-card p-4 mb-4 h-20" />

      <div className="flex gap-2 mb-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-8 w-20 bg-card rounded-full" />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-4 h-16" />
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-background h-11" />
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="px-4 py-4 border-t border-border flex items-center gap-4">
            <div className="h-4 w-20 bg-card rounded" />
            <div className="h-4 flex-1 bg-card rounded" />
            <div className="h-4 w-24 bg-card rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
