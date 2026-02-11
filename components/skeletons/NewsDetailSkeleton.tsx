import { Skeleton } from '@/components/ui/Skeleton'

export function NewsDetailSkeleton() {
    return (
        <div className="pt-24 md:pt-32 pb-20 px-4 sm:px-12 md:px-20 min-h-screen bg-black">
            <div className="max-w-4xl mx-auto">
                {/* Breadcrumbs Skeleton */}
                <div className="mb-8 flex items-center gap-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-40" />
                </div>

                {/* Tags Skeleton */}
                <div className="flex gap-2 mb-6">
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <Skeleton className="h-6 w-24 rounded-full" />
                </div>

                {/* Title Skeleton */}
                <div className="space-y-3 mb-6">
                    <Skeleton className="h-8 md:h-12 w-full" />
                    <Skeleton className="h-8 md:h-12 w-3/4" />
                </div>

                {/* Meta Info Skeleton */}
                <div className="flex items-center gap-6 border-b border-white/5 pb-8 mb-12">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-28" />
                </div>

                {/* Image Skeleton */}
                <Skeleton className="aspect-video w-full rounded-3xl mb-12" />

                {/* Content Skeleton */}
                <div className="space-y-4 mb-12">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-11/12" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-10/12" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-11/12" />
                    <Skeleton className="h-4 w-9/12" />
                    <Skeleton className="h-4 w-full" />
                </div>
            </div>
        </div>
    )
}
