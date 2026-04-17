import { Skeleton } from '@/components/ui/Skeleton'

export function ProductionCardSkeleton() {
  return (
    <div className="card-hover">
      <div className="h-56 rounded-lg overflow-hidden bg-skeleton border border-border">
        <Skeleton className="w-full h-full" />
      </div>
    </div>
  )
}
