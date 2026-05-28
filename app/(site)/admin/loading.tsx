export default function AdminLoading() {
  return (
    <div className="min-h-screen bg-background p-6 animate-pulse">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="h-8 w-48 rounded-xl bg-surface" />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-surface" />
          ))}
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="h-48 rounded-xl bg-surface" />
          <div className="h-48 rounded-xl bg-surface" />
        </div>
      </div>
    </div>
  )
}
