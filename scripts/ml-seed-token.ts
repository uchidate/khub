/**
 * Migra token ML do token.json para o banco (SystemSettings).
 * Rode uma vez após autenticar: npx tsx scripts/ml-seed-token.ts
 */
import prisma from '../lib/prisma'
import fs from 'fs'
import path from 'path'

async function main() {
    const tokenPath = path.join(process.cwd(), 'scripts/mercadolivre/token.json')
    if (!fs.existsSync(tokenPath)) {
        console.error('token.json não encontrado. Execute scripts/mercadolivre/auth.py primeiro.')
        process.exit(1)
    }

    const token = JSON.parse(fs.readFileSync(tokenPath, 'utf-8'))

    await prisma.systemSettings.upsert({
        where: { id: 'singleton' },
        create: {
            id: 'singleton',
            mlAccessToken: token.access_token,
            mlRefreshToken: token.refresh_token,
            mlTokenExpiresAt: new Date(token.expires_at * 1000),
            mlUserId: String(token.user_id),
        },
        update: {
            mlAccessToken: token.access_token,
            mlRefreshToken: token.refresh_token,
            mlTokenExpiresAt: new Date(token.expires_at * 1000),
            mlUserId: String(token.user_id),
        },
    })

    console.log(`✅ Token ML salvo no banco. user_id: ${token.user_id}`)
    console.log(`   Expira em: ${new Date(token.expires_at * 1000).toLocaleString('pt-BR')}`)
    await prisma.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
