import { Skeleton } from '@/components/ui/Skeleton'

export function NewsCardSkeleton() {
  return (
    <div className="card-hover">
      <div className="bg-skeleton rounded-lg overflow-hidden border border-border p-6">
        <Skeleton className="h-6 w-3/4 mb-3" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-5/6 mb-4" />
        <Skeleton className="h-3 w-32" />
      </div>
    </div>
  )
}
