import prisma from '@/lib/prisma'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { cache } from 'react'
import type { Metadata } from 'next'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { JsonLd } from '@/components/seo/JsonLd'
import { Music2, Clock, ExternalLink, Disc3 } from 'lucide-react'
import { SITE_URL } from '@/lib/constants/site'

export const revalidate = 3600

const getAlbum = cache(async (id: string) =>
    prisma.album.findUnique({
        where: { id },
        include: {
            artist: {
                select: { id: true, nameRomanized: true, nameHangul: true, slug: true, primaryImageUrl: true },
            },
            legacyRelease: {
                include: {
                    tracks: {
                        orderBy: [{ discNumber: 'asc' }, { trackNumber: 'asc' }],
                        select: {
                            id: true,
                            title: true,
                            trackNumber: true,
                            discNumber: true,
                            durationMs: true,
                            externalLinks: {
                                where: { platform: { slug: 'spotify' } },
                                select: { url: true },
                                take: 1,
                            },
                        },
                    },
                    externalLinks: {
                        select: { url: true, platform: { select: { slug: true, name: true } } },
                    },
                },
            },
        },
    })
)

function fmtDuration(ms: number | null): string {
    if (!ms) return '--:--'
    const s = Math.round(ms / 1000)
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

const TYPE_LABELS: Record<string, string> = {
    ALBUM: 'Álbum', EP: 'EP', SINGLE: 'Single',
    MINI_ALBUM: 'Mini Álbum', FULL_ALBUM: 'Álbum Completo',
    OST: 'OST', REPACKAGE: 'Repackage', COMPILATION: 'Compilação',
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params
    const album = await getAlbum(id)
    if (!album) return { title: 'Álbum não encontrado' }
    const title = `${album.title} — ${album.artist.nameRomanized}`
    return {
        title: `${title} | HallyuHub`,
        description: `${TYPE_LABELS[album.type] ?? album.type} de ${album.artist.nameRomanized}${album.releaseDate ? ` (${new Date(album.releaseDate).getFullYear()})` : ''}`,
        openGraph: {
            title: `${title} | HallyuHub`,
            url: `${SITE_URL}/albums/${id}`,
            images: album.coverUrl ? [{ url: album.coverUrl, width: 500, height: 500, alt: album.title }] : [],
        },
    }
}

export default async function AlbumPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const album = await getAlbum(id)
    if (!album) notFound()

    const artistHref = `/artists/${album.artist.slug ?? album.artist.id}`
    const typeLabel = TYPE_LABELS[album.type] ?? album.type
    const year = album.releaseDate ? new Date(album.releaseDate).getFullYear() : null
    const tracks = album.legacyRelease?.tracks ?? []
    const externalLinks = album.legacyRelease?.externalLinks ?? []
    const spotifyLink = externalLinks.find(l => l.platform?.slug === 'spotify')?.url
        ?? album.spotifyUrl
    const appleMusicLink = album.appleMusicUrl
    const youtubeLink = album.youtubeUrl

    // Group tracks by disc
    const discs = tracks.reduce<Record<number, typeof tracks>>((acc, t) => {
        const disc = t.discNumber ?? 1
        acc[disc] = acc[disc] ?? []
        acc[disc].push(t)
        return acc
    }, {})
    const discNumbers = Object.keys(discs).map(Number).sort()
    const multiDisc = discNumbers.length > 1

    const totalMs = tracks.reduce((sum, t) => sum + (t.durationMs ?? 0), 0)

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'MusicAlbum',
        name: album.title,
        byArtist: { '@type': 'MusicGroup', name: album.artist.nameRomanized },
        image: album.coverUrl,
        datePublished: album.releaseDate?.toISOString().slice(0, 10),
        numTracks: tracks.length,
    }

    return (
        <div className="page-wrap py-8 md:py-12 pb-[calc(var(--bottom-nav-h)+2rem)]">
            <JsonLd data={jsonLd} />
            <Breadcrumbs items={[
                { label: album.artist.nameRomanized, href: artistHref },
                { label: album.title },
            ]} />

            <div className="mt-6 flex flex-col sm:flex-row gap-6 md:gap-8">
                {/* Cover */}
                <div className="flex-shrink-0">
                    {album.coverUrl ? (
                        <Image
                            src={album.coverUrl}
                            alt={album.title}
                            width={200}
                            height={200}
                            className="rounded-2xl shadow-xl object-cover"
                            priority
                        />
                    ) : (
                        <div className="w-[200px] h-[200px] rounded-2xl bg-surface border border-border flex items-center justify-center">
                            <Disc3 className="w-16 h-16 text-muted/40" />
                        </div>
                    )}
                </div>

                {/* Meta */}
                <div className="flex-1 min-w-0">
                    <span className="text-caption text-accent font-black uppercase tracking-widest">{typeLabel}</span>
                    <h1 className="text-display font-black text-foreground mt-1 mb-2">{album.title}</h1>
                    <Link href={artistHref} className="text-subtitle text-muted hover:text-accent transition-colors font-bold">
                        {album.artist.nameRomanized}
                        {album.artist.nameHangul && <span className="ml-2 text-small font-normal text-muted/60">{album.artist.nameHangul}</span>}
                    </Link>
                    <div className="flex items-center gap-3 mt-3 text-caption text-muted flex-wrap">
                        {year && <span>{year}</span>}
                        {tracks.length > 0 && <><span>·</span><span>{tracks.length} faixa{tracks.length !== 1 ? 's' : ''}</span></>}
                        {totalMs > 0 && <><span>·</span><span className="flex items-center gap-1"><Clock className="w-3 h-3" />{fmtDuration(totalMs)}</span></>}
                    </div>

                    {/* Streaming links */}
                    <div className="flex items-center gap-3 mt-4 flex-wrap">
                        {spotifyLink && (
                            <a href={spotifyLink} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1DB954]/10 text-[#1DB954] text-small font-bold hover:bg-[#1DB954]/20 transition-colors">
                                <Music2 className="w-3.5 h-3.5" /> Spotify
                            </a>
                        )}
                        {appleMusicLink && (
                            <a href={appleMusicLink} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface border border-border text-small font-bold hover:border-border-strong transition-colors">
                                <Music2 className="w-3.5 h-3.5" /> Apple Music
                            </a>
                        )}
                        {youtubeLink && (
                            <a href={youtubeLink} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface border border-border text-small font-bold hover:border-border-strong transition-colors">
                                <ExternalLink className="w-3.5 h-3.5" /> YouTube
                            </a>
                        )}
                    </div>
                </div>
            </div>

            {/* Tracklist */}
            {tracks.length > 0 && (
                <div className="mt-10">
                    <h2 className="text-subtitle font-black text-foreground mb-4">Tracklist</h2>
                    {discNumbers.map(disc => (
                        <div key={disc} className="mb-6">
                            {multiDisc && (
                                <p className="text-caption text-muted font-black uppercase tracking-widest mb-2">Disco {disc}</p>
                            )}
                            <div className="bg-surface border border-border rounded-xl overflow-hidden">
                                {discs[disc].map((track, idx) => {
                                    const spotify = track.externalLinks[0]?.url
                                    return (
                                        <div
                                            key={track.id}
                                            className={`flex items-center gap-3 px-4 py-3 hover:bg-surface-hover transition-colors ${idx !== discs[disc].length - 1 ? 'border-b border-border' : ''}`}
                                        >
                                            <span className="text-caption text-muted w-6 text-right flex-shrink-0">{track.trackNumber ?? idx + 1}</span>
                                            <span className="flex-1 text-body text-foreground font-medium truncate">{track.title}</span>
                                            <span className="text-caption text-muted flex-shrink-0">{fmtDuration(track.durationMs)}</span>
                                            {spotify && (
                                                <a href={spotify} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 text-muted hover:text-[#1DB954] transition-colors">
                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                </a>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
