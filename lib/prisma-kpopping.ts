import { PrismaClient } from '../node_modules/.prisma/kpopping-client'
import { PrismaPg } from '@prisma/adapter-pg'

function createKpoppingPrisma() {
  const url = process.env.KPOPPING_DATABASE_URL
  if (!url) throw new Error('KPOPPING_DATABASE_URL not set')
  const adapter = new PrismaPg({ connectionString: url })
  return new PrismaClient({ adapter })
}

const globalForKpopping = globalThis as unknown as {
  kpoppingPrisma: PrismaClient | undefined
}

const kpoppingPrisma =
  globalForKpopping.kpoppingPrisma ?? createKpoppingPrisma()

if (process.env.NODE_ENV !== 'production') {
  globalForKpopping.kpoppingPrisma = kpoppingPrisma
}

export default kpoppingPrisma
