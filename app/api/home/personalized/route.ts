import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { unstable_cache } from 'next/cache'

// Top trending artists (cached 2 min) — mesma lista usada na homepage
const getTrendingArtistIds = unstable_cache(
    async () => {
        const artists = await prisma.artist.findMany({
            where: { flaggedAsNonKorean: false, isHidden: false, nameRomanized: { not: '' } },
            take: 16,
            orderBy: { trendingScore: 'desc' },
            select: {
                id: true, slug: true, nameRomanized: true, nameHangul: true,
                primaryImageUrl: true, roles: true, gender: true, agency: { select: { name: true } },
            },
        })
        return artists
    },
    ['home-trending-artists'],
    { revalidate: 120 }
)

export async function GET() {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
        return NextResponse.json({ isLoggedIn: false, hasFavorites: false, recommendedArtists: [] })
    }

    const [trendingArtists, favRows] = await Promise.all([
        getTrendingArtistIds(),
        prisma.favorite.findMany({
            where: { userId: (session.user as { id: string }).id, artistId: { not: null } },
            select: { artistId: true },
        }),
    ])

    const hasFavorites = favRows.length > 0
    const favSet = new Set(favRows.map(f => f.artistId!))
    let recommendedArtists = trendingArtists.filter(a => !favSet.has(a.id)).slice(0, 8)
    if (recommendedArtists.length < 2) {
        recommendedArtists = trendingArtists.slice(8, 12)
    }

    return NextResponse.json({ isLoggedIn: true, hasFavorites, recommendedArtists })
}
