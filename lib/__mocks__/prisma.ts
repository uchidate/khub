import { vi } from 'vitest'

const prisma = {
  artist: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
    upsert: vi.fn(),
  },
  cronLock: {
    findUnique: vi.fn(),
    upsert: vi.fn(),
    delete: vi.fn(),
  },
  production: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
  },
  artistProduction: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    deleteMany: vi.fn(),
  },
  $executeRaw: vi.fn(),
}

export default prisma
