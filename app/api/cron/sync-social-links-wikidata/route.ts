import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { findArtistSocialLinks } from '@/lib/services/wikidata-social-links'
import prisma from '@/lib/prisma'

/**
 * Cron Job - Sync Artist Social Links via Wikidata
 *
 * Processes artists that have no social links yet (socialLinksUpdatedAt IS NULL),
 * ordered by trendingScore DESC. Each artist is searched on Wikidata by name,
 * and found links are merged with any existing ones (existing takes priority).
 *
 * AUTHENTICATION: Requires CRON_SECRET via Authorization: Bearer or ?token=
 * RETURNS: 202 Accepted immediately — processing continues in background.
 *
 * POST /api/cron/sync-social-links-wikidata          → sync 15 artists
 * POST /api/cron/sync-social-links-wikidata?limit=N  → sync N artists (max 50)
 */
export async function POST(request: NextRequest) {
    const requestId = `cron-wikidata-social-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`

    const log = {
        info: (message: string, context?: any) => {
            console.log(JSON.stringify({
                timestamp: new Date().toISOString(),
                level: 'info',
                service: 'CRON_WIKIDATA_SOCIAL_LINKS',
                message,
                requestId,
                ...context,
            }))
        },
        error: (message: string, context?: any) => {
            console.error(JSON.stringify({
                timestamp: new Date().toISOString(),
                level: 'error',
                service: 'CRON_WIKIDATA_SOCIAL_LINKS',
                message,
                requestId,
                ...context,
            }))
        },
    }

    // Authentication
    const authToken = request.headers.get('authorization')?.replace('Bearer ', '')
        || request.nextUrl.searchParams.get('token')
    const expectedToken = process.env.CRON_SECRET || process.env.NEXTAUTH_SECRET

    if (!expectedToken) {
        log.error('CRON_SECRET not configured')
        return NextResponse.json({ success: false, error: 'Cron secret not configured' }, { status: 500 })
    }

    const tokenValid = authToken !== null
        && authToken.length === expectedToken.length
        && timingSafeEqual(Buffer.from(authToken), Buffer.from(expectedToken))

    if (!tokenValid) {
        log.error('Unauthorized access attempt')
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const rawLimit = parseInt(request.nextUrl.searchParams.get('limit') || '15')
    const limit = Math.min(Math.max(1, rawLimit), 50)

    log.info('Starting Wikidata social links sync in background', { limit })

    // Fire-and-forget
    runWikidataSync(limit, requestId, log).catch(err => {
        log.error('Unhandled error in background Wikidata social links sync', {
            error: err instanceof Error ? err.message : String(err),
        })
    })

    return NextResponse.json({
        status: 'accepted',
        message: 'Wikidata social links sync started in background',
        requestId,
        limit,
        timestamp: new Date().toISOString(),
    }, { status: 202 })
}

async function runWikidataSync(
    limit: number,
    requestId: string,
    log: { info: (msg: string, ctx?: any) => void; error: (msg: string, ctx?: any) => void }
) {
    const startTime = Date.now()

    const artists = await prisma.artist.findMany({
        where: { socialLinksUpdatedAt: null },
        orderBy: { trendingScore: 'desc' },
        take: limit,
        select: {
            id: true,
            nameRomanized: true,
            nameHangul: true,
            socialLinks: true,
        },
    })

    log.info('Artists to process', { count: artists.length })

    let found = 0
    let notFound = 0
    let errors = 0

    for (let i = 0; i < artists.length; i++) {
        const artist = artists[i]

        try {
            const links = await findArtistSocialLinks(artist.nameRomanized, artist.nameHangul)

            if (Object.keys(links).length === 0) {
                notFound++
                log.info('No social links found', { artist: artist.nameRomanized })
                // Mark as attempted so we don't keep retrying every run
                await prisma.artist.update({
                    where: { id: artist.id },
                    data: { socialLinksUpdatedAt: new Date() },
                })
            } else {
                const existing = (artist.socialLinks as Record<string, string> | null) || {}
                const merged = { ...links, ...existing } // existing takes priority

                await prisma.artist.update({
                    where: { id: artist.id },
                    data: { socialLinks: merged, socialLinksUpdatedAt: new Date() },
                })

                found++
                log.info('Social links saved', {
                    artist: artist.nameRomanized,
                    platforms: Object.keys(links),
                })
            }
        } catch (err) {
            errors++
            log.error('Failed to process artist', {
                artist: artist.nameRomanized,
                error: err instanceof Error ? err.message : String(err),
            })
        }

        // Respect Wikidata rate limit between artists
        if (i < artists.length - 1) {
            await new Promise(r => setTimeout(r, 1200))
        }
    }

    const duration = Math.round((Date.now() - startTime) / 1000)
    log.info('Wikidata social links sync completed', {
        processed: artists.length,
        found,
        notFound,
        errors,
        duration_s: duration,
    })
}

export async function GET() {
    return NextResponse.json({
        error: 'Method not allowed. Use POST.',
        hint: 'POST /api/cron/sync-social-links-wikidata?limit=15',
    }, { status: 405 })
}
