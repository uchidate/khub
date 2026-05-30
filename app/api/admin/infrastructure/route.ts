import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import { getCoolifyService } from '@/lib/services/coolify-service'

/** GET /api/admin/infrastructure — status de apps + scheduled tasks */
export async function GET(request: NextRequest) {
    const { error } = await requireAdmin()
    if (error) return error

    try {
        const coolify = getCoolifyService()
        const env = (request.nextUrl.searchParams.get('env') as 'production' | 'staging') || 'production'

        const [app, tasks] = await Promise.all([
            coolify.getApp(env),
            coolify.getScheduledTasks(env),
        ])

        return NextResponse.json({ app, tasks })
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        const isTokenMissing = msg.includes('COOLIFY_TOKEN not configured')
        const isUnauthorized = msg.includes('401') || msg.toLowerCase().includes('unauthenticated')
        return NextResponse.json({
            error: msg,
            hint: isTokenMissing
                ? 'COOLIFY_TOKEN não está configurado neste ambiente.'
                : isUnauthorized
                    ? 'Token do Coolify inválido ou expirado. Atualize COOLIFY_TOKEN no GitHub Secret E nas env vars do container no Coolify UI.'
                    : 'Erro ao conectar com o Coolify.',
        }, { status: 502 })
    }
}

/** POST /api/admin/infrastructure — ações: deploy, toggle-task */
export async function POST(request: NextRequest) {
    const { error } = await requireAdmin()
    if (error) return error

    try {
        const body = await request.json()
        const { action, env = 'production', taskUuid, enabled, force } = body
        const coolify = getCoolifyService()

        if (action === 'deploy') {
            const result = await coolify.deploy(env, !!force)
            return NextResponse.json({ ok: true, ...result })
        }

        if (action === 'toggle-task' && taskUuid) {
            const task = await coolify.updateScheduledTask(env, taskUuid, { enabled: !!enabled })
            return NextResponse.json({ ok: true, task })
        }

        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        return NextResponse.json({ error: msg }, { status: 502 })
    }
}
