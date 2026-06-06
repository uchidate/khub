export default function HubLoading() {
  return (
    <div className="min-h-screen bg-background animate-pulse">
      <div className="border-b border-border/40 bg-surface">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="h-4 w-24 rounded bg-surface-hover mb-3" />
          <div className="h-10 w-64 rounded-xl bg-surface-hover mb-2" />
          <div className="h-4 w-96 rounded bg-surface-hover" />
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="aspect-[2/3] rounded-xl bg-surface" />
              <div className="h-3 w-3/4 rounded bg-surface" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
