import React from 'react'

interface SkeletonLoaderProps {
    type?: 'card' | 'text' | 'circle' | 'rectangle'
    count?: number
    className?: string
    width?: string
    height?: string
}

export function SkeletonLoader({
    type = 'text',
    count = 1,
    className = '',
    width,
    height
}: SkeletonLoaderProps) {
    const skeletons = Array.from({ length: count }, (_, i) => i)

    const getSkeletonClass = () => {
        switch (type) {
            case 'card':
                return 'skeleton-card'
            case 'text':
                return 'skeleton-text'
            case 'circle':
                return 'skeleton rounded-full'
            case 'rectangle':
                return 'skeleton'
            default:
                return 'skeleton'
        }
    }

    const style = {
        ...(width && { width }),
        ...(height && { height })
    }

    return (
        <>
            {skeletons.map((index) => (
                <div
                    key={index}
                    className={`${getSkeletonClass()} ${className}`}
                    style={style}
                />
            ))}
        </>
    )
}

// Pre-built skeleton layouts
export function CardSkeleton({ count = 1 }: { count?: number }) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {Array.from({ length: count }, (_, i) => (
                <div key={i} className="space-y-3">
                    <SkeletonLoader type="card" />
                    <SkeletonLoader type="text" width="80%" />
                    <SkeletonLoader type="text" width="60%" height="12px" />
                </div>
            ))}
        </div>
    )
}

export function ListSkeleton({ count = 3 }: { count?: number }) {
    return (
        <div className="space-y-4">
            {Array.from({ length: count }, (_, i) => (
                <div key={i} className="flex gap-4 p-4 bg-zinc-900/50 rounded-xl">
                    <SkeletonLoader type="rectangle" width="80px" height="80px" />
                    <div className="flex-1 space-y-3">
                        <SkeletonLoader type="text" width="70%" />
                        <SkeletonLoader type="text" width="40%" height="12px" />
                        <SkeletonLoader type="text" width="50%" height="12px" />
                    </div>
                </div>
            ))}
        </div>
    )
}

export function ProfileSkeleton() {
    return (
        <div className="flex items-center gap-4 p-6">
            <SkeletonLoader type="circle" width="80px" height="80px" />
            <div className="flex-1 space-y-3">
                <SkeletonLoader type="text" width="200px" height="24px" />
                <SkeletonLoader type="text" width="150px" height="16px" />
                <SkeletonLoader type="text" width="250px" height="14px" />
            </div>
        </div>
    )
}
