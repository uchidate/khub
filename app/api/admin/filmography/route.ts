import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getFilmographySyncService, SyncStrategy } from '@/lib/services/filmography-sync-service'
import { z } from 'zod'

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
    // Check authentication
    const session = await auth()

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const { artistIds, strategy, concurrency } = syncSchema.parse(body)

    const syncService = getFilmographySyncService()

    // If no artist IDs provided, sync outdated filmographies
    if (!artistIds || artistIds.length === 0) {
      console.log('Starting sync for outdated filmographies...')

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
      console.log(`Syncing single artist: ${artistIds[0]}`)

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
    console.log(`Syncing ${artistIds.length} artists...`)

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
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Filmography sync error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: (error as Error).message },
      { status: 500 }
    )
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
    // Check authentication
    const session = await auth()

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      )
    }

    const syncService = getFilmographySyncService()
    const stats = await syncService.getFilmographyStats()

    return NextResponse.json({
      success: true,
      stats,
    })

  } catch (error) {
    console.error('Get filmography stats error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
