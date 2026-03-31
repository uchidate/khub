import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import { getFilmographySyncService, SyncStrategy } from '@/lib/services/filmography-sync-service'
import { toHttpError } from '@/lib/repositories/base'
import { z } from 'zod'
import { createLogger } from '@/lib/utils/logger'
import { getErrorMessage } from '@/lib/utils/error'

const log = createLogger('ADMIN-FILMOGRAPHY')

// Force dynamic rendering (uses auth/headers)
export const dynamic = 'force-dynamic'

const syncSchema = z.object({
  artistIds: z.array(z.string()).optional(),
  strategy: z.enum(['FULL_REPLACE', 'INCREMENTAL', 'SMART_MERGE']).optional().default('SMART_MERGE'),
  concurrency: z.number().min(1).max(10).optional().default(3),
})

/**
 * POST /api/admin/filmography
 * Trigger filmography sync for artists
 *
 * Body:
 * - artistIds?: string[] - Specific artists to sync (empty = sync outdated)
 * - strategy?: SyncStrategy - Sync strategy (default: SMART_MERGE)
 * - concurrency?: number - Concurrent workers (default: 3)
 *
 * Auth: Admin only
 */
export async function POST(request: NextRequest) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const body = await request.json()
    const { artistIds, strategy, concurrency } = syncSchema.parse(body)

    const syncService = getFilmographySyncService()

    // If no artist IDs provided, sync outdated filmographies
    if (!artistIds || artistIds.length === 0) {
      log.info('Starting sync for outdated filmographies...')

      const result = await syncService.syncOutdatedFilmographies(
        7, // 7 days
        10, // limit
        concurrency
      )

      await syncService.notifyBatchSyncComplete(result)

      return NextResponse.json({
        success: true,
        message: `Batch sync completed`,
        result: {
          total: result.total,
          successCount: result.successCount,
          failureCount: result.failureCount,
          duration: result.duration,
        },
      })
    }

    // Sync specific artists
    if (artistIds.length === 1) {
      log.info('Syncing single artist', { artistId: artistIds[0] })

      const result = await syncService.syncSingleArtist(artistIds[0], strategy as SyncStrategy)

      if (result.success) {
        await syncService.notifySyncComplete(result)
      }

      return NextResponse.json({
        success: result.success,
        message: result.success
          ? `Filmografia sincronizada: ${result.addedCount} adicionadas, ${result.updatedCount} atualizadas`
          : `Falha na sincronização: ${result.errors.join(', ')}`,
        result,
      })
    }

    // Batch sync multiple artists
    log.info('Syncing multiple artists', { count: artistIds.length })

    const result = await syncService.syncMultipleArtists(
      artistIds,
      concurrency,
      strategy as SyncStrategy
    )

    await syncService.notifyBatchSyncComplete(result)

    return NextResponse.json({
      success: true,
      message: `Batch sync completed: ${result.successCount}/${result.total} successful`,
      result: {
        total: result.total,
        successCount: result.successCount,
        failureCount: result.failureCount,
        duration: result.duration,
      },
    })

  } catch (error) {
    log.error('Filmography sync error', { error: getErrorMessage(error) })
    return toHttpError(error)
  }
}

/**
 * GET /api/admin/filmography
 * Get filmography statistics
 *
 * Auth: Admin only
 */
export async function GET() {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const syncService = getFilmographySyncService()
    const stats = await syncService.getFilmographyStats()

    return NextResponse.json({
      success: true,
      stats,
    })

  } catch (error) {
    log.error('Get filmography stats error', { error: getErrorMessage(error) })
    return toHttpError(error)
  }
}
