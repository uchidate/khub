import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../prisma', () => import('../../__mocks__/prisma'))

import { TrendingService } from '../trending-service'
import prisma from '../../__mocks__/prisma'

describe('TrendingService', () => {
  let service: TrendingService

  beforeEach(() => {
    vi.clearAllMocks()
    service = TrendingService.getInstance()
  })

  describe('calculateTrendingScore', () => {
    it('returns 0 for non-existent artist', async () => {
      prisma.artist.findUnique.mockResolvedValue(null)
      const score = await service.calculateTrendingScore('non-existent')
      expect(score).toBe(0)
    })

    it('calculates score for artist with no engagement', async () => {
      prisma.artist.findUnique.mockResolvedValue({
        id: '1',
        viewCount: 0,
        favoriteCount: 0,
        bio: null,
        primaryImageUrl: null,
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        _count: { productions: 0 },
      })

      const score = await service.calculateTrendingScore('1')
      // viewScore=0 + favoriteScore=0 + recentScore=0 + completeness=0
      expect(score).toBe(0)
    })

    it('calculates max view score correctly', async () => {
      prisma.artist.findUnique.mockResolvedValue({
        id: '1',
        viewCount: 10000,
        favoriteCount: 0,
        bio: null,
        primaryImageUrl: null,
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        _count: { productions: 0 },
      })

      const score = await service.calculateTrendingScore('1')
      // viewScore = min(10000/10000, 1) * 0.3 = 0.3
      expect(score).toBeCloseTo(0.3, 2)
    })

    it('caps view score at 1.0 for counts above max', async () => {
      prisma.artist.findUnique.mockResolvedValue({
        id: '1',
        viewCount: 50000, // 5x above max
        favoriteCount: 0,
        bio: null,
        primaryImageUrl: null,
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        _count: { productions: 0 },
      })

      const score = await service.calculateTrendingScore('1')
      expect(score).toBeCloseTo(0.3, 2) // still capped at 0.3
    })

    it('calculates max favorite score correctly', async () => {
      prisma.artist.findUnique.mockResolvedValue({
        id: '1',
        viewCount: 0,
        favoriteCount: 1000,
        bio: null,
        primaryImageUrl: null,
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        _count: { productions: 0 },
      })

      const score = await service.calculateTrendingScore('1')
      // favoriteScore = min(1000/1000, 1) * 0.4 = 0.4
      expect(score).toBeCloseTo(0.4, 2)
    })

    it('gives recency boost for new artists (< 7 days)', async () => {
      prisma.artist.findUnique.mockResolvedValue({
        id: '1',
        viewCount: 0,
        favoriteCount: 0,
        bio: null,
        primaryImageUrl: null,
        createdAt: new Date(), // created now
        _count: { productions: 0 },
      })

      const score = await service.calculateTrendingScore('1')
      // recentScore ≈ (1 - 0/7) * 0.2 = 0.2
      expect(score).toBeCloseTo(0.2, 1)
    })

    it('no recency boost for old artists (> 7 days)', async () => {
      prisma.artist.findUnique.mockResolvedValue({
        id: '1',
        viewCount: 0,
        favoriteCount: 0,
        bio: null,
        primaryImageUrl: null,
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days
        _count: { productions: 0 },
      })

      const score = await service.calculateTrendingScore('1')
      expect(score).toBe(0)
    })

    it('calculates full completeness score', async () => {
      prisma.artist.findUnique.mockResolvedValue({
        id: '1',
        viewCount: 0,
        favoriteCount: 0,
        bio: 'Has a bio',
        primaryImageUrl: 'https://example.com/photo.jpg',
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        _count: { productions: 5 },
      })

      const score = await service.calculateTrendingScore('1')
      // completeness = (1+1+1)/3 * 0.1 = 0.1
      expect(score).toBeCloseTo(0.1, 2)
    })

    it('calculates combined score for popular artist', async () => {
      prisma.artist.findUnique.mockResolvedValue({
        id: '1',
        viewCount: 5000,
        favoriteCount: 500,
        bio: 'Famous artist',
        primaryImageUrl: 'https://example.com/photo.jpg',
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        _count: { productions: 10 },
      })

      const score = await service.calculateTrendingScore('1')
      // viewScore = 0.5 * 0.3 = 0.15
      // favoriteScore = 0.5 * 0.4 = 0.20
      // recentScore = 0
      // completeness = 1.0 * 0.1 = 0.10
      expect(score).toBeCloseTo(0.45, 2)
    })
  })

  describe('updateAllTrendingScores', () => {
    it('calls $executeRaw for batch update', async () => {
      prisma.artist.count.mockResolvedValue(50)
      prisma.$executeRaw.mockResolvedValue(50)

      await service.updateAllTrendingScores()

      expect(prisma.artist.count).toHaveBeenCalled()
      expect(prisma.$executeRaw).toHaveBeenCalled()
    })
  })
})
