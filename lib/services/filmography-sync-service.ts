/**
 * Filmography Sync Service
 *
 * Orchestrates synchronization of artist filmographies from TMDB to database.
 * Features:
 * - Multiple sync strategies (FULL_REPLACE, INCREMENTAL, SMART_MERGE)
 * - Deduplication of productions
 * - Batch processing with concurrency control
 * - Error handling and recovery
 * - Slack notifications
 * - Progress tracking
 */

import prisma from '@/lib/prisma'
import { getTMDBFilmographyService, NotFoundError } from './tmdb-filmography-service'
import { TMDBProductionData } from '@/lib/types/tmdb'
import { getSlackService } from './slack-notification-service'

export type SyncStrategy = 'FULL_REPLACE' | 'INCREMENTAL' | 'SMART_MERGE'

export interface SyncResult {
  success: boolean
  artistId: string
  artistName: string
  tmdbId: number | null
  addedCount: number
  updatedCount: number
  skippedCount: number
  errors: string[]
  duration: number
}

export interface BatchSyncResult {
  total: number
  successCount: number
  failureCount: number
  results: SyncResult[]
  duration: number
}

/**
 * Calculate string similarity using Levenshtein distance
 */
function stringSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase()
  const s2 = str2.toLowerCase()

  const matrix: number[][] = []

  for (let i = 0; i <= s2.length; i++) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= s1.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= s2.length; i++) {
    for (let j = 1; j <= s1.length; j++) {
      if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1 // deletion
        )
      }
    }
  }

  const maxLength = Math.max(s1.length, s2.length)
  return 1 - matrix[s2.length][s1.length] / maxLength
}

export class FilmographySyncService {
  private tmdbService = getTMDBFilmographyService()
  private slackService = getSlackService()

  // ============================================================================
  // SINGLE ARTIST SYNC
  // ============================================================================

  /**
   * Sync filmography for a single artist
   */
  async syncSingleArtist(
    artistId: string,
    strategy: SyncStrategy = 'SMART_MERGE'
  ): Promise<SyncResult> {
    const startTime = Date.now()
    const result: SyncResult = {
      success: false,
      artistId,
      artistName: '',
      tmdbId: null,
      addedCount: 0,
      updatedCount: 0,
      skippedCount: 0,
      errors: [],
      duration: 0,
    }

    try {
      // Get artist from database
      const artist = await prisma.artist.findUnique({
        where: { id: artistId },
        include: { productions: { include: { production: true } } },
      })

      if (!artist) {
        throw new Error(`Artist not found: ${artistId}`)
      }

      result.artistName = artist.nameRomanized

      // Update last attempt timestamp
      await prisma.artist.update({
        where: { id: artistId },
        data: { tmdbLastAttempt: new Date() },
      })

      // Find person on TMDB
      const tmdbPerson = await this.tmdbService.findPersonByName(
        artist.nameRomanized,
        artist.nameHangul
      )

      if (!tmdbPerson) {
        result.errors.push('Person not found on TMDB')
        await prisma.artist.update({
          where: { id: artistId },
          data: {
            tmdbSyncStatus: 'NOT_FOUND',
            tmdbLastAttempt: new Date(),
          },
        })
        return result
      }

      result.tmdbId = tmdbPerson.id

      // Get credits
      const credits = await this.tmdbService.getPersonCredits(tmdbPerson.id)
      const productions = await this.tmdbService.transformCreditsToProductions(credits)

      console.log(`Found ${productions.length} productions for ${artist.nameRomanized}`)

      // Handle different sync strategies
      if (strategy === 'FULL_REPLACE') {
        // Delete all existing filmography
        await prisma.artistProduction.deleteMany({
          where: { artistId },
        })
      }

      // Process each production
      for (const prodData of productions) {
        try {
          const processResult = await this.processProduction(artistId, prodData, strategy)

          if (processResult === 'added') {
            result.addedCount++
          } else if (processResult === 'updated') {
            result.updatedCount++
          } else if (processResult === 'skipped') {
            result.skippedCount++
          }
        } catch (error) {
          result.errors.push(`Failed to process production ${prodData.title}: ${(error as Error).message}`)
        }
      }

      // Update artist sync status
      await prisma.artist.update({
        where: { id: artistId },
        data: {
          tmdbId: tmdbPerson.id.toString(),
          tmdbSyncStatus: 'SYNCED',
          tmdbLastSync: new Date(),
          tmdbLastAttempt: new Date(),
        },
      })

      result.success = true
    } catch (error) {
      result.errors.push((error as Error).message)

      if (error instanceof NotFoundError) {
        await prisma.artist.update({
          where: { id: artistId },
          data: { tmdbSyncStatus: 'NOT_FOUND' },
        })
      } else {
        await prisma.artist.update({
          where: { id: artistId },
          data: { tmdbSyncStatus: 'ERROR' },
        })
      }
    } finally {
      result.duration = Date.now() - startTime
    }

    return result
  }

  // ============================================================================
  // BATCH SYNC
  // ============================================================================

  /**
   * Sync multiple artists with concurrency control
   */
  async syncMultipleArtists(
    artistIds: string[],
    concurrency: number = 3,
    strategy: SyncStrategy = 'SMART_MERGE'
  ): Promise<BatchSyncResult> {
    const startTime = Date.now()
    const results: SyncResult[] = []
    const queue = [...artistIds]
    const workers: Promise<void>[] = []

    for (let i = 0; i < concurrency; i++) {
      workers.push(
        (async () => {
          while (queue.length > 0) {
            const artistId = queue.shift()
            if (!artistId) break

            try {
              const result = await this.syncSingleArtist(artistId, strategy)
              results.push(result)

              // Log progress
              const progress = results.length
              const total = artistIds.length
              console.log(`Progress: ${progress}/${total} (${Math.round((progress / total) * 100)}%)`)
            } catch (error) {
              console.error(`Failed to sync artist ${artistId}:`, error)
              results.push({
                success: false,
                artistId,
                artistName: 'Unknown',
                tmdbId: null,
                addedCount: 0,
                updatedCount: 0,
                skippedCount: 0,
                errors: [(error as Error).message],
                duration: 0,
              })
            }
          }
        })()
      )
    }

    await Promise.all(workers)

    const successCount = results.filter(r => r.success).length
    const failureCount = results.filter(r => !r.success).length

    return {
      total: artistIds.length,
      successCount,
      failureCount,
      results,
      duration: Date.now() - startTime,
    }
  }

  /**
   * Sync all artists without filmography
   */
  async syncArtistsWithoutFilmography(
    concurrency: number = 3
  ): Promise<BatchSyncResult> {
    const artists = await prisma.artist.findMany({
      where: {
        productions: { none: {} },
      },
      select: { id: true },
    })

    console.log(`Found ${artists.length} artists without filmography`)

    return await this.syncMultipleArtists(
      artists.map(a => a.id),
      concurrency,
      'INCREMENTAL'
    )
  }

  /**
   * Sync outdated artist filmographies (not updated in X days)
   */
  async syncOutdatedFilmographies(
    daysOld: number = 7,
    limit: number = 10,
    concurrency: number = 3
  ): Promise<BatchSyncResult> {
    const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000)

    const artists = await prisma.artist.findMany({
      where: {
        OR: [
          { tmdbLastSync: { lt: cutoffDate } },
          { tmdbLastSync: null, tmdbSyncStatus: { not: 'NOT_FOUND' } },
        ],
      },
      orderBy: { tmdbLastSync: { sort: 'asc', nulls: 'first' } },
      take: limit,
      select: { id: true },
    })

    console.log(`Found ${artists.length} artists with outdated filmographies`)

    return await this.syncMultipleArtists(
      artists.map(a => a.id),
      concurrency,
      'INCREMENTAL'
    )
  }

  // ============================================================================
  // PRODUCTION PROCESSING
  // ============================================================================

  /**
   * Process a single production: find existing or create new
   */
  private async processProduction(
    artistId: string,
    prodData: TMDBProductionData,
    strategy: SyncStrategy
  ): Promise<'added' | 'updated' | 'skipped'> {
    // Find existing production
    const existingProduction = await this.findMatchingProduction(prodData)

    if (existingProduction) {
      // Check if artist-production relationship already exists
      const existingRelation = await prisma.artistProduction.findUnique({
        where: {
          artistId_productionId: {
            artistId,
            productionId: existingProduction.id,
          },
        },
      })

      if (existingRelation) {
        if (strategy === 'SMART_MERGE' && prodData.role !== existingRelation.role) {
          // Update role if different
          await prisma.artistProduction.update({
            where: {
              artistId_productionId: {
                artistId,
                productionId: existingProduction.id,
              },
            },
            data: { role: prodData.role },
          })
          return 'updated'
        }
        return 'skipped'
      }

      // Create relationship
      await prisma.artistProduction.create({
        data: {
          artistId,
          productionId: existingProduction.id,
          role: prodData.role,
        },
      })

      return 'added'
    }

    // Create new production
    const newProduction = await prisma.production.create({
      data: {
        titlePt: prodData.title,
        titleKr: prodData.titleKr,
        type: prodData.tmdbType === 'movie' ? 'FILME' : 'SERIE',
        year: prodData.year,
        synopsis: prodData.synopsis,
        imageUrl: prodData.imageUrl,
        tmdbId: prodData.tmdbId.toString(),
        tmdbType: prodData.tmdbType,
        releaseDate: prodData.releaseDate,
        runtime: prodData.runtime,
        voteAverage: prodData.voteAverage,
        streamingPlatforms: prodData.streamingPlatforms,
        sourceUrls: [],
        tags: [],
      },
    })

    // Create relationship
    await prisma.artistProduction.create({
      data: {
        artistId,
        productionId: newProduction.id,
        role: prodData.role,
      },
    })

    return 'added'
  }

  /**
   * Find matching production in database using multiple strategies
   */
  private async findMatchingProduction(
    prodData: TMDBProductionData
  ): Promise<any | null> {
    // 1. Try exact TMDB ID match
    if (prodData.tmdbId) {
      const match = await prisma.production.findFirst({
        where: { tmdbId: prodData.tmdbId.toString() },
      })
      if (match) return match
    }

    // 2. Try exact Korean title + year match
    if (prodData.titleKr && prodData.year) {
      const match = await prisma.production.findFirst({
        where: {
          titleKr: prodData.titleKr,
          year: prodData.year,
        },
      })
      if (match) return match
    }

    // 3. Try fuzzy Portuguese title + year match
    if (prodData.year) {
      const type = prodData.tmdbType === 'movie' ? 'FILME' : 'SERIE'
      const candidates = await prisma.production.findMany({
        where: {
          year: prodData.year,
          type,
        },
      })

      for (const candidate of candidates) {
        const similarity = stringSimilarity(candidate.titlePt, prodData.title)
        if (similarity > 0.9) {
          return candidate
        }
      }
    }

    return null
  }

  // ============================================================================
  // NOTIFICATIONS
  // ============================================================================

  /**
   * Send Slack notification for successful sync
   */
  async notifySyncComplete(result: SyncResult): Promise<void> {
    if (!result.success) return

    try {
      await this.slackService.notifyContentAdded({
        type: 'filmography',
        name: result.artistName,
        details: {
          '✅ Adicionadas': `${result.addedCount} produções`,
          '🔄 Atualizadas': `${result.updatedCount} produções`,
          '⏭️ Ignoradas': `${result.skippedCount} produções`,
          '🔗 TMDB ID': result.tmdbId?.toString() || 'N/A',
          '⏱️ Duração': `${(result.duration / 1000).toFixed(1)}s`,
        },
      })
    } catch (error) {
      console.error('Failed to send Slack notification:', error)
    }
  }

  /**
   * Send Slack notification for batch sync
   */
  async notifyBatchSyncComplete(result: BatchSyncResult): Promise<void> {
    try {
      const totalAdded = result.results.reduce((sum, r) => sum + r.addedCount, 0)
      const totalUpdated = result.results.reduce((sum, r) => sum + r.updatedCount, 0)

      await this.slackService.sendAlert({
        title: '📊 Atualização em Lote - Filmografias',
        details: {
          'Total Artistas': `${result.total}`,
          '✅ Sucesso': `${result.successCount}`,
          '❌ Falhas': `${result.failureCount}`,
          '➕ Produções Adicionadas': `${totalAdded}`,
          '🔄 Produções Atualizadas': `${totalUpdated}`,
          '⏱️ Duração': `${Math.floor(result.duration / 60000)}m ${Math.floor((result.duration % 60000) / 1000)}s`,
        },
        severity: result.failureCount > 0 ? 'warning' : 'success',
      })
    } catch (error) {
      console.error('Failed to send batch Slack notification:', error)
    }
  }

  // ============================================================================
  // STATISTICS
  // ============================================================================

  /**
   * Get filmography statistics
   */
  async getFilmographyStats(): Promise<{
    totalArtists: number
    withFilmography: number
    withoutFilmography: number
    syncedRecently: number
    needsUpdate: number
  }> {
    const [
      totalArtists,
      withFilmography,
      syncedRecently,
      needsUpdate,
    ] = await Promise.all([
      prisma.artist.count(),
      prisma.artist.count({
        where: {
          productions: { some: {} },
        },
      }),
      prisma.artist.count({
        where: {
          tmdbLastSync: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      prisma.artist.count({
        where: {
          OR: [
            { tmdbLastSync: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
            { tmdbLastSync: null, tmdbSyncStatus: { not: 'NOT_FOUND' } },
          ],
        },
      }),
    ])

    return {
      totalArtists,
      withFilmography,
      withoutFilmography: totalArtists - withFilmography,
      syncedRecently,
      needsUpdate,
    }
  }
}

// Export singleton instance
let instance: FilmographySyncService | null = null

export function getFilmographySyncService(): FilmographySyncService {
  if (!instance) {
    instance = new FilmographySyncService()
  }
  return instance
}
