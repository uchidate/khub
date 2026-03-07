export default function ProductionLoading() {
  return (
    <div className="min-h-screen bg-black">
      {/* Hero */}
      <div className="relative h-[70vh] md:h-[80vh] bg-zinc-900 animate-pulse" />

      {/* Content */}
      <div className="px-4 sm:px-12 md:px-20 py-12">
        <div className="grid lg:grid-cols-3 gap-12 max-w-[1600px] mx-auto">
          {/* Sidebar */}
          <div className="space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="h-40 rounded-2xl bg-zinc-900 animate-pulse" />
            ))}
          </div>
          {/* Main */}
          <div className="lg:col-span-2 space-y-8">
            <div className="h-5 w-32 rounded bg-zinc-800 animate-pulse" />
            <div className="h-48 rounded-2xl bg-zinc-900 animate-pulse" />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-28 rounded-xl bg-zinc-900 animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
