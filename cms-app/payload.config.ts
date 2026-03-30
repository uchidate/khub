import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { fileURLToPath } from 'url'
import { Categories } from './payload/collections/Categories'
import { Posts } from './payload/collections/Posts'
import { Users } from './payload/collections/Users'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
    admin: {
        importMap: {
            baseDir: path.resolve(dirname),
        },
    },
    collections: [Users, Categories, Posts],
    db: postgresAdapter({
        pool: {
            connectionString: process.env.DATABASE_URL,
        },
        schemaName: 'payload',
        push: process.env.PAYLOAD_PUSH_SCHEMA === 'true',
    }),
    editor: lexicalEditor(),
    secret: process.env.PAYLOAD_SECRET || 'dev-secret-change-in-prod',
    typescript: {
        outputFile: path.resolve(dirname, 'payload-types.ts'),
    },
    serverURL: process.env.PAYLOAD_SERVER_URL || 'http://localhost:3001',
    cors: [
        process.env.PAYLOAD_SERVER_URL || 'http://localhost:3001',
        'https://hallyuhub.com.br',
        'https://www.hallyuhub.com.br',
        'https://staging.hallyuhub.com.br',
        'https://cms.hallyuhub.com.br',
        'https://cms-staging.hallyuhub.com.br',
    ],
    csrf: [
        process.env.PAYLOAD_SERVER_URL || 'http://localhost:3001',
        'https://hallyuhub.com.br',
        'https://www.hallyuhub.com.br',
        'https://staging.hallyuhub.com.br',
        'https://cms.hallyuhub.com.br',
        'https://cms-staging.hallyuhub.com.br',
    ],
})
