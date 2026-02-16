import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => import('../../__mocks__/prisma'))

import { acquireCronLock, releaseCronLock } from '../cron-lock-service'
import prisma from '../../__mocks__/prisma'

describe('CronLockService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('acquireCronLock', () => {
    it('acquires lock when no existing lock', async () => {
      prisma.cronLock.findUnique.mockResolvedValue(null)
      prisma.cronLock.upsert.mockResolvedValue({})

      const lockId = await acquireCronLock()

      expect(lockId).toBeTruthy()
      expect(lockId).toMatch(/^cron-/)
      expect(prisma.cronLock.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'cron-update' },
        })
      )
    })

    it('rejects lock when active lock exists', async () => {
      prisma.cronLock.findUnique.mockResolvedValue({
        id: 'cron-update',
        lockedBy: 'cron-existing',
        lockedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // expires in 30min
      })

      const lockId = await acquireCronLock()

      expect(lockId).toBeNull()
      expect(prisma.cronLock.upsert).not.toHaveBeenCalled()
    })

    it('acquires lock when existing lock is expired', async () => {
      prisma.cronLock.findUnique.mockResolvedValue({
        id: 'cron-update',
        lockedBy: 'cron-old',
        lockedAt: new Date(Date.now() - 60 * 60 * 1000), // 1h ago
        expiresAt: new Date(Date.now() - 30 * 60 * 1000), // expired 30min ago
      })
      prisma.cronLock.upsert.mockResolvedValue({})

      const lockId = await acquireCronLock()

      expect(lockId).toBeTruthy()
      expect(prisma.cronLock.upsert).toHaveBeenCalled()
    })

    it('returns null on database error', async () => {
      prisma.cronLock.findUnique.mockRejectedValue(new Error('DB connection failed'))

      const lockId = await acquireCronLock()

      expect(lockId).toBeNull()
    })
  })

  describe('releaseCronLock', () => {
    it('releases lock when requestId matches', async () => {
      const requestId = 'cron-123'
      prisma.cronLock.findUnique.mockResolvedValue({
        id: 'cron-update',
        lockedBy: requestId,
        lockedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      })
      prisma.cronLock.delete.mockResolvedValue({})

      await releaseCronLock(requestId)

      expect(prisma.cronLock.delete).toHaveBeenCalledWith({
        where: { id: 'cron-update' },
      })
    })

    it('does not release lock when requestId does not match', async () => {
      prisma.cronLock.findUnique.mockResolvedValue({
        id: 'cron-update',
        lockedBy: 'cron-other',
        lockedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      })

      await releaseCronLock('cron-mine')

      expect(prisma.cronLock.delete).not.toHaveBeenCalled()
    })

    it('handles gracefully when no lock exists', async () => {
      prisma.cronLock.findUnique.mockResolvedValue(null)

      await releaseCronLock('cron-123')

      expect(prisma.cronLock.delete).not.toHaveBeenCalled()
    })

    it('handles database error gracefully', async () => {
      prisma.cronLock.findUnique.mockRejectedValue(new Error('DB error'))

      // Should not throw
      await expect(releaseCronLock('cron-123')).resolves.toBeUndefined()
    })
  })
})
