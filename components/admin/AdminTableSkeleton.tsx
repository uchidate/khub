/**
 * AdminTableSkeleton
 *
 * Skeleton loader padronizado para todas as páginas de lista do admin.
 * Substitui "Carregando..." por uma animação de loading que preserva o layout.
 */

interface AdminTableSkeletonProps {
  rows?: number
  columns?: number
  showHeader?: boolean
}

function SkeletonCell({ wide }: { wide?: boolean }) {
  return (
    <div
      className={`h-4 rounded bg-zinc-800 animate-pulse ${wide ? 'w-3/4' : 'w-1/2'}`}
    />
  )
}

export function AdminTableSkeleton({
  rows = 8,
  columns = 4,
  showHeader = true,
}: AdminTableSkeletonProps) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      {/* Header skeleton */}
      {showHeader && (
        <div className="px-4 py-3 border-b border-zinc-800 flex items-center gap-3">
          <div className="h-4 w-24 rounded bg-zinc-800 animate-pulse" />
          <div className="h-4 w-32 rounded bg-zinc-800/60 animate-pulse" />
          <div className="ml-auto h-8 w-28 rounded-lg bg-zinc-800/60 animate-pulse" />
        </div>
      )}

      {/* Rows */}
      <div className="divide-y divide-zinc-800/60">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="px-4 py-3 flex items-center gap-4">
            {/* Avatar */}
            <div className="w-8 h-8 rounded-lg bg-zinc-800 animate-pulse flex-shrink-0" />
            {/* Columns */}
            {Array.from({ length: columns }).map((_, j) => (
              <div key={j} className="flex-1 min-w-0">
                <SkeletonCell wide={j === 0} />
              </div>
            ))}
            {/* Action */}
            <div className="w-6 h-6 rounded bg-zinc-800/60 animate-pulse flex-shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * AdminCardSkeleton
 * Para páginas de detalhe / cards individuais.
 */
export function AdminCardSkeleton({ lines = 4 }: { lines?: number }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
      <div className="h-5 w-40 rounded bg-zinc-800 animate-pulse" />
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`h-3.5 rounded bg-zinc-800/70 animate-pulse ${
            i === lines - 1 ? 'w-2/3' : 'w-full'
          }`}
        />
      ))}
    </div>
  )
}

/**
 * AdminStatsSkeleton
 * Para os cards de estatísticas no dashboard / topo de páginas.
 */
export function AdminStatsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className={`grid grid-cols-2 sm:grid-cols-${Math.min(count, 4)} gap-3`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-2">
          <div className="w-4 h-4 rounded bg-zinc-800 animate-pulse" />
          <div className="h-6 w-16 rounded bg-zinc-800 animate-pulse" />
          <div className="h-3 w-20 rounded bg-zinc-800/60 animate-pulse" />
        </div>
      ))}
    </div>
  )
}
