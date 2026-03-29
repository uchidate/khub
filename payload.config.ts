import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { fileURLToPath } from 'url'

const filename = fileURLToPath(import.meta.url)
const dirname  = path.dirname(filename)

// Collections will be added in Phase 2
const collections: Parameters<typeof buildConfig>[0]['collections'] = []

export default buildConfig({
    // ── Admin UI ──────────────────────────────────────────────────────────
    admin: {
        // Payload admin lives at /cms — not /admin (taken by custom admin)
        // Auth is handled by Next.js middleware (Phase 1) — no Payload-native login
        meta: {
            titleSuffix: '— HallyuHub CMS',
            description:  'HallyuHub Content Management',
        },
        importMap: {
            baseDir: path.resolve(dirname),
        },
    },

    // ── Collections ───────────────────────────────────────────────────────
    collections,

    // ── Database — PostgreSQL, isolated in 'payload' schema ──────────────
    // Uses a separate PostgreSQL schema so Payload (Drizzle) and the existing
    // app (Prisma) never touch each other's tables.
    db: postgresAdapter({
        pool: {
            connectionString: process.env.DATABASE_URL,
        },
        schemaName: 'payload',
    }),

    // ── Default editor ────────────────────────────────────────────────────
    editor: lexicalEditor(),

    // ── Secret ────────────────────────────────────────────────────────────
    secret: process.env.PAYLOAD_SECRET || process.env.NEXTAUTH_SECRET || 'dev-secret-change-in-prod',

    // ── TypeScript output ────────────────────────────────────────────────
    typescript: {
        outputFile: path.resolve(dirname, 'payload-types.ts'),
    },

    // ── Server URL ────────────────────────────────────────────────────────
    serverURL: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
})
