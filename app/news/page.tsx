import { Suspense } from 'react'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
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

const newsWithArtistsInclude = {
    artists: {
        include: {
            artist: {
                select: { id: true, nameRomanized: true }
            }
        }
    }
} as const

async function NewsGrid() {
    const session = await getServerSession(authOptions)

    let news
    let isPersonalized = false
    let followingCount = 0

    if (session?.user?.email) {
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: {
                favorites: {
                    where: { artistId: { not: null } },
                    select: { artistId: true },
                }
            }
        })

        const favoriteArtistIds = (user?.favorites ?? [])
            .map(f => f.artistId)
            .filter((id): id is string => id !== null)

        if (favoriteArtistIds.length > 0) {
            news = await prisma.news.findMany({
                where: {
                    artists: {
                        some: { artistId: { in: favoriteArtistIds } }
                    }
                },
                orderBy: { publishedAt: 'desc' },
                take: 50,
                include: newsWithArtistsInclude,
            })
            isPersonalized = true
            followingCount = favoriteArtistIds.length
        }
    }

    // Fallback: feed padrão (sem login ou sem favoritos)
    if (!news) {
        news = await prisma.news.findMany({
            orderBy: { publishedAt: 'desc' },
            take: 50,
            include: newsWithArtistsInclude,
        })
    }

    return (
        <>
            {isPersonalized && (
                <div className="mb-8 px-4 py-3 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center gap-3">
                    <span className="text-purple-400 text-sm font-bold uppercase tracking-wider">
                        Feed personalizado
                    </span>
                    <span className="text-zinc-400 text-sm">
                        Notícias dos {followingCount} artista{followingCount > 1 ? 's' : ''} que você segue
                    </span>
                </div>
            )}

            {news.length === 0 && isPersonalized && (
                <p className="text-zinc-500 text-center py-16">
                    Nenhuma notícia encontrada para seus artistas favoritos ainda.
                    <br />
                    <span className="text-sm">O feed é atualizado automaticamente a cada 15 minutos.</span>
                </p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 perspective-1000">
                {news.map((item) => {
                    const artistNames = item.artists
                        .map(a => a.artist.nameRomanized)
                    return (
                        <MediaCard
                            key={item.id}
                            id={item.id}
                            title={item.title}
                            subtitle={new Date(item.publishedAt).toLocaleDateString('pt-BR')}
                            imageUrl={item.imageUrl}
                            type="news"
                            href={`/news/${item.id}`}
                            badges={item.tags?.slice(0, 3) || []}
                            artists={artistNames}
                            aspectRatio="video"
                        />
                    )
                })}
            </div>
        </>
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
