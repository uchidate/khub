export default function HubsLoading() {
  return (
    <div className="min-h-screen bg-background animate-pulse">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="h-8 w-28 rounded-xl bg-surface mb-2" />
        <div className="h-4 w-72 rounded bg-surface mb-10" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-surface h-36" />
          ))}
        </div>
      </div>
    </div>
  )
}
