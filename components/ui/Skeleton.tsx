export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-[#f0f0f0] rounded ${className || ''}`} />
  )
}
