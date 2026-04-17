export default function GroupLoading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative h-[65vh] md:h-[75vh] bg-surface animate-pulse" />

      {/* Content */}
      <div className="px-4 sm:px-12 md:px-20 py-12">
        <div className="grid lg:grid-cols-3 gap-12 max-w-[1600px] mx-auto">
          {/* Sidebar */}
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-36 rounded-2xl bg-surface animate-pulse" />
            ))}
          </div>
          {/* Main — members grid */}
          <div className="lg:col-span-2 space-y-8">
            <div className="h-5 w-28 rounded bg-[#f0f0f0] animate-pulse" />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <div key={i} className="h-32 rounded-xl bg-surface animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
