import { Skeleton } from '@/components/ui/Skeleton'

export function ArtistCardSkeleton() {
  return (
    <div className="card-hover">
      <div className="aspect-[3/4] rounded-lg overflow-hidden bg-zinc-900 border border-white/5">
        <Skeleton className="w-full h-full" />
      </div>
    </div>
  )
}
