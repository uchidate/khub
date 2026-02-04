import { Skeleton } from '@/components/ui/Skeleton'

export function ProductionCardSkeleton() {
  return (
    <div className="card-hover">
      <div className="h-56 rounded-lg overflow-hidden bg-zinc-900 border border-white/5">
        <Skeleton className="w-full h-full" />
      </div>
    </div>
  )
}
