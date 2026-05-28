export default function BlogPostLoading() {
  return (
    <div className="min-h-screen bg-background animate-pulse">
      <div className="h-[50vh] bg-surface" />
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-4">
        <div className="h-8 w-3/4 rounded-xl bg-surface" />
        <div className="h-4 w-1/3 rounded bg-surface" />
        <div className="mt-8 space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-4 rounded bg-surface" style={{ width: `${85 + (i % 3) * 5}%` }} />
          ))}
        </div>
      </div>
    </div>
  )
}
