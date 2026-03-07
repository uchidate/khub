export default function ArtistLoading() {
  return (
    <div className="min-h-screen bg-black">
      {/* Hero */}
      <div className="relative h-[65vh] md:h-[75vh] bg-zinc-900 animate-pulse" />

      {/* Content */}
      <div className="px-4 sm:px-12 md:px-20 py-12">
        <div className="grid lg:grid-cols-3 gap-12 max-w-[1600px] mx-auto">
          {/* Sidebar */}
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 rounded-2xl bg-zinc-900 animate-pulse" />
            ))}
          </div>
          {/* Main */}
          <div className="lg:col-span-2 space-y-8">
            <div className="h-6 w-48 rounded bg-zinc-800 animate-pulse" />
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 rounded-xl bg-zinc-900 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
