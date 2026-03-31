import { buildConfig } from 'payload'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { fileURLToPath } from 'url'
import { Artists } from './payload/collections/Artists'
import { Categories } from './payload/collections/Categories'
import { Media } from './payload/collections/Media'
import { MusicalGroups } from './payload/collections/MusicalGroups'
import { Posts } from './payload/collections/Posts'
import { Users } from './payload/collections/Users'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
    email: nodemailerAdapter({
        defaultFromAddress: process.env.SMTP_FROM || 'no_reply@hallyuhub.com.br',
        defaultFromName: 'HallyuHub CMS',
        transportOptions: {
            host: process.env.SMTP_HOST || 'smtp.hostinger.com',
            port: Number(process.env.SMTP_PORT) || 587,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        },
    }),
    admin: {
        importMap: {
            baseDir: path.resolve(dirname),
        },
        livePreview: {
            url: ({ data, collectionConfig }) => {
                const siteUrl = process.env.SITE_URL || 'https://www.hallyuhub.com.br'
                if (collectionConfig?.slug === 'posts' && data?.slug) {
                    return `${siteUrl}/blog/${data.slug}`
                }
                return siteUrl
            },
            collections: ['posts'],
        },
    },
    collections: [Users, Categories, Posts, Media, Artists, MusicalGroups],
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
