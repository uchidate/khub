// Loading skeleton for artist/production cards
export function SkeletonCard() {
  return (
    <div className="animate-pulse">
      {/* Image skeleton */}
      <div className="aspect-[2/3] bg-zinc-800 rounded-lg" />

      {/* Title skeleton */}
      <div className="mt-4 h-4 bg-zinc-800 rounded w-3/4" />

      {/* Subtitle skeleton */}
      <div className="mt-2 h-3 bg-zinc-800 rounded w-1/2" />
    </div>
  )
}

export function SkeletonGrid({ count = 10 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 md:gap-10">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}
