export default function SearchLoading() {
  return (
    <div className="min-h-screen bg-background py-8 md:py-12 px-4 sm:px-12 md:px-20">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="h-4 w-24 rounded bg-[#f0f0f0] animate-pulse mb-8" />
        <div className="flex items-center gap-3 mb-10">
          <div className="w-14 h-14 rounded-xl bg-[#f0f0f0] animate-pulse" />
          <div className="space-y-2">
            <div className="h-8 w-64 rounded bg-[#f0f0f0] animate-pulse" />
            <div className="h-4 w-40 rounded bg-[#f0f0f0] animate-pulse" />
          </div>
        </div>
        {/* Results sections */}
        {[1, 2].map(section => (
          <div key={section} className="mb-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-surface animate-pulse" />
              <div className="space-y-1.5">
                <div className="h-6 w-32 rounded bg-[#f0f0f0] animate-pulse" />
                <div className="h-3 w-20 rounded bg-[#f0f0f0] animate-pulse" />
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="aspect-square rounded-xl bg-surface animate-pulse" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
