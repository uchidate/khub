import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const prismaClientSingleton = () => {
    const connectionString = process.env.DATABASE_URL
    if (!connectionString) {
        throw new Error('DATABASE_URL environment variable is not set')
    }

    // Pool with explicit limits to prevent connection exhaustion
    const pool = new Pool({
        connectionString,
        max: 10,              // max concurrent connections
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
    })

    const adapter = new PrismaPg(pool)

    return new PrismaClient({
        adapter,
        // Never log queries in production — causes massive stdout I/O overhead
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    })
}

declare global {
    var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma

// Always preserve singleton to avoid multiple pool instances
if (!globalThis.prismaGlobal) globalThis.prismaGlobal = prisma
