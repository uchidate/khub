/**
 * Seed: Templates de Email padrão
 *
 * Execução: npx tsx prisma/seed-email-templates.ts
 * (ou pelo npm script: npm run seed:email-templates)
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
    console.log('🌱 Seeding email templates...')

    for (const tpl of DEFAULT_TEMPLATES) {
        const existing = await prisma.emailTemplate.findUnique({ where: { slug: tpl.slug } })

        if (existing) {
            console.log(`  ⏭  Já existe: ${tpl.slug} — pulando (edite pelo admin para atualizar)`)
            continue
        }

        await prisma.emailTemplate.create({ data: tpl })
        console.log(`  ✅ Criado: ${tpl.slug}`)
    }

    console.log('✅ Seed concluído!')
}

main()
    .catch(e => { console.error(e); process.exit(1) })
    .finally(() => prisma.$disconnect())
