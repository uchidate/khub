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
        max: 20,                        // Increased from 10 — more headroom under concurrent load
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000, // Increased from 5s — gives more time to acquire connection
    })

    // Kill stuck queries — prevents pool exhaustion from runaway queries
    // 60s in production (complex pages have deep JOINs), 30s in development
    const statementTimeout = process.env.NODE_ENV === 'production' ? 60000 : 30000
    pool.on('connect', (client) => {
        client.query(`SET statement_timeout = ${statementTimeout}`).catch(() => {})
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
