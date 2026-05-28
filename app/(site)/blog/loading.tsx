export default function BlogLoading() {
  return (
    <div className="min-h-screen bg-background animate-pulse">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="h-8 w-32 rounded-xl bg-surface mb-8" />
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
