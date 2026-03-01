/**
 * Atualiza templates de email para as versões mais recentes.
 * Execução: npx tsx prisma/update-email-templates.ts
 */

import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { DEFAULT_TEMPLATES } from '../lib/email/default-templates'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
    console.log('🔄 Atualizando templates de email...')

    for (const tpl of DEFAULT_TEMPLATES) {
        await prisma.emailTemplate.upsert({
            where: { slug: tpl.slug },
            update: {
                name: tpl.name,
                subject: tpl.subject,
                htmlContent: tpl.htmlContent,
                variables: tpl.variables,
            },
            create: tpl,
        })
        console.log(`  ✅ ${tpl.slug}`)
    }

    console.log('✅ Templates atualizados!')
}

main()
    .catch(e => { console.error(e); process.exit(1) })
    .finally(() => prisma.$disconnect())
