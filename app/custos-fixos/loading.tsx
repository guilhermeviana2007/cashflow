export default function Loading() {
  return (
    <div className="animate-pulse space-y-4 max-w-lg">
      <div className="h-7 w-36 bg-card rounded-lg mb-1" />
      <div className="h-4 w-52 bg-card rounded mb-6" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-xl border border-border bg-card p-5 h-16" />
      ))}
    </div>
  );
}
