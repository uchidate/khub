export default function NewsLoading() {
  return (
    <div className="min-h-screen bg-background py-8 md:py-12 px-4 sm:px-12 md:px-20">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumbs */}
        <div className="h-4 w-48 rounded bg-[#f0f0f0] animate-pulse mb-8" />
        {/* Image */}
        <div className="aspect-video rounded-2xl bg-surface animate-pulse mb-8" />
        {/* Tags */}
        <div className="flex gap-2 mb-4">
          {[1, 2].map(i => <div key={i} className="h-5 w-16 rounded-full bg-[#f0f0f0] animate-pulse" />)}
        </div>
        {/* Title */}
        <div className="h-10 rounded bg-[#f0f0f0] animate-pulse mb-2" />
        <div className="h-8 w-3/4 rounded bg-[#f0f0f0] animate-pulse mb-6" />
        {/* Meta */}
        <div className="h-4 w-40 rounded bg-[#f0f0f0] animate-pulse mb-8" />
        {/* Content paragraphs */}
        <div className="space-y-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className={`h-4 rounded bg-surface animate-pulse ${i % 3 === 0 ? 'w-2/3' : 'w-full'}`} />
          ))}
        </div>
      </div>
    </div>
  )
}
