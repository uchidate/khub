import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { sendManualEmail } from '@/lib/services/email-service'
import { createLogger } from '@/lib/utils/logger'

const log = createLogger('ADMIN-EMAIL-RESEND')

export async function POST(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (session?.user?.role?.toLowerCase() !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const original = await prisma.emailLog.findUnique({ where: { id } })
    if (!original) return NextResponse.json({ error: 'Log não encontrado' }, { status: 404 })
    if (!original.templateSlug) {
        return NextResponse.json({ error: 'Email sem template — reenvio não disponível' }, { status: 400 })
    }

    // Para reenvio reconstituímos as variáveis do metadata quando disponíveis.
    // O template será re-renderizado do banco (pega a versão atual).
    const meta = (original.metadata as Record<string, string> | null) ?? {}
    const vars: Record<string, string> = {}
    for (const [k, v] of Object.entries(meta)) {
        if (typeof v === 'string') vars[k] = v
    }

    const ok = await sendManualEmail(original.to, original.templateSlug, vars, original.userId ?? undefined)

    if (!ok) {
        log.error('Falha no reenvio', { originalId: id, to: original.to })
        return NextResponse.json({ error: 'Falha ao reenviar — verifique os logs' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
}
