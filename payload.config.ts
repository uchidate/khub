import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { fileURLToPath } from 'url'
import { Categories } from './payload/collections/Categories'
import { Posts } from './payload/collections/Posts'
import { Users } from './payload/collections/Users'

const filename = fileURLToPath(import.meta.url)
const dirname  = path.dirname(filename)

export default buildConfig({
    // ── Admin UI ──────────────────────────────────────────────────────────
    admin: {
        // Payload admin lives at /cms — not /admin (taken by custom admin)
        // Auth is fully handled by Next.js middleware (NextAuth JWT check).
        // Payload-native login UI is disabled: users arrive here already authenticated.
        meta: {
            titleSuffix: '— HallyuHub CMS',
            description:  'HallyuHub Content Management',
        },
        importMap: {
            baseDir: path.resolve(dirname),
        },
    },

    // ── Collections ───────────────────────────────────────────────────────
    collections: [Users, Categories, Posts],

    // ── Database — PostgreSQL, isolated in 'payload' schema ──────────────
    // Uses a separate PostgreSQL schema so Payload (Drizzle) and the existing
    // app (Prisma) never touch each other's tables.
    db: postgresAdapter({
        pool: {
            connectionString: process.env.DATABASE_URL,
        },
        schemaName: 'payload',
        // push: true makes Drizzle push schema on startup without needing migration files.
        // Controlled via PAYLOAD_PUSH_SCHEMA=true (set in Coolify env vars).
        push: process.env.PAYLOAD_PUSH_SCHEMA === 'true',
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
