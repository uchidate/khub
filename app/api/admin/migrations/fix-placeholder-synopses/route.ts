import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'

/**
 * POST /api/admin/migrations/fix-placeholder-synopses
 *
 * Executa o cleanup de sinopses placeholder que a migração
 * 20260318120000_cleanup_placeholder_synopses não conseguiu aplicar
 * (translationStatus é NOT NULL — não pode ser setado para NULL).
 *
 * Também marca a migração com falha como "aplicada" no _prisma_migrations
 * para desbloquear futuros deploys.
 */
export async function POST() {
    const { error } = await requireAdmin()
    if (error) return error

    const PLACEHOLDERS = ['Sem sinopse disponível.', 'No synopsis available.']

    try {
        // 1. Corrigir as produções: zerar synopsis e synopsisSource,
        //    marcar translationStatus como 'skipped' (NOT NULL constraint)
        const updated = await prisma.$executeRawUnsafe(`
            UPDATE "Production"
            SET
                synopsis          = NULL,
                "synopsisSource"  = NULL,
                "translationStatus" = 'skipped',
                "translatedAt"    = NULL
            WHERE synopsis = ANY($1::text[])
        `, PLACEHOLDERS)

        // 2. Marcar a migração com falha como "applied" para desbloquear o Prisma
        //    (o SQL correto já rodou acima — a migração está efetivamente completa)
        await prisma.$executeRawUnsafe(`
            UPDATE "_prisma_migrations"
            SET
                finished_at = NOW(),
                logs        = 'Resolved manually via admin API — translationStatus is NOT NULL, used ''skipped'' instead of NULL'
            WHERE migration_name = '20260318120000_cleanup_placeholder_synopses'
              AND finished_at IS NULL
        `)

        return NextResponse.json({
            ok: true,
            updatedProductions: updated,
            message: `${updated} produções com sinopse placeholder limpas e marcadas como 'skipped'. Migração desbloqueada.`,
        })
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        return NextResponse.json({ ok: false, error: msg }, { status: 500 })
    }
}
