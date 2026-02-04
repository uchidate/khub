import { Suspense } from 'react'
import prisma from "@/lib/prisma"
import type { Metadata } from "next"
import { MediaCard } from "@/components/ui/MediaCard"
import { SectionHeader } from "@/components/ui/SectionHeader"
import { PageTransition } from "@/components/features/PageTransition"

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
    title: 'Notícias',
    description: 'Fique por dentro de tudo o que acontece no vibrante mundo do entretenimento coreano.',
}

function SkeletonGrid() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-video bg-zinc-900 rounded-xl animate-pulse border border-white/5" />
            ))}
        </div>
    )
}

async function NewsGrid() {
    const news = await prisma.news.findMany({
        orderBy: { publishedAt: 'desc' },
        take: 50
    })

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 perspective-1000">
            {news.map((item: any) => (
                <MediaCard
                    key={item.id}
                    id={item.id}
                    title={item.title}
                    subtitle={new Date(item.publishedAt).toLocaleDateString('pt-BR')}
                    imageUrl={item.imageUrl}
                    type="news"
                    href={`/news/${item.id}`}
                    badges={item.tags?.slice(0, 3) || []}
                    aspectRatio="video"
                />
            ))}
        </div>
    )
}

export default async function NewsPage() {
    return (
        <PageTransition className="pt-24 md:pt-32 pb-20 px-4 sm:px-12 md:px-20">
            <SectionHeader
                title="Notícias"
                subtitle="Fique por dentro de tudo o que acontece no vibrante mundo do entretenimento coreano."
            />

            <Suspense fallback={<SkeletonGrid />}>
                <NewsGrid />
            </Suspense>
        </PageTransition>
    )
}
