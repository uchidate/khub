export default function BlogCategoryLoading() {
  return (
    <div className="min-h-screen bg-background animate-pulse">
      <div className="border-b border-border/40 bg-surface">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="h-3 w-24 rounded bg-surface-hover mb-2" />
          <div className="h-9 w-40 rounded-xl bg-surface-hover mb-2" />
          <div className="h-3 w-32 rounded bg-surface-hover" />
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-surface overflow-hidden">
              <div className="aspect-video bg-surface-hover" />
              <div className="p-4 space-y-2">
                <div className="h-4 w-3/4 rounded bg-surface-hover" />
                <div className="h-3 w-full rounded bg-surface-hover" />
                <div className="h-3 w-2/3 rounded bg-surface-hover" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
