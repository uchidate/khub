export default function NewsLoading() {
  return (
    <div className="min-h-screen bg-black pt-24 md:pt-32 pb-20 px-4 sm:px-12 md:px-20">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumbs */}
        <div className="h-4 w-48 rounded bg-zinc-800 animate-pulse mb-8" />
        {/* Image */}
        <div className="aspect-video rounded-2xl bg-zinc-900 animate-pulse mb-8" />
        {/* Tags */}
        <div className="flex gap-2 mb-4">
          {[1, 2].map(i => <div key={i} className="h-5 w-16 rounded-full bg-zinc-800 animate-pulse" />)}
        </div>
        {/* Title */}
        <div className="h-10 rounded bg-zinc-800 animate-pulse mb-2" />
        <div className="h-8 w-3/4 rounded bg-zinc-800 animate-pulse mb-6" />
        {/* Meta */}
        <div className="h-4 w-40 rounded bg-zinc-800 animate-pulse mb-8" />
        {/* Content paragraphs */}
        <div className="space-y-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className={`h-4 rounded bg-zinc-900 animate-pulse ${i % 3 === 0 ? 'w-2/3' : 'w-full'}`} />
          ))}
        </div>
      </div>
    </div>
  )
}
