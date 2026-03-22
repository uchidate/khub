import { Skeleton } from '@/components/ui/Skeleton'

export function ProductionCardSkeleton() {
  return (
    <div className="card-hover">
      <div className="h-56 rounded-lg overflow-hidden bg-[#f5f5f7] border border-white/5">
        <Skeleton className="w-full h-full" />
      </div>
    </div>
  )
}
