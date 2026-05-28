export default function CalendarioLoading() {
  return (
    <div className="min-h-screen bg-background animate-pulse">
      <div className="max-w-6xl mx-auto px-4 py-12 space-y-8">
        <div className="h-8 w-48 rounded-xl bg-surface" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-surface">
              <div className="w-16 h-16 rounded-full bg-surface-hover" />
              <div className="h-3 w-20 rounded bg-surface-hover" />
              <div className="h-3 w-12 rounded bg-surface-hover" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
