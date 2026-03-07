/**
 * GET /api/admin/nginx-logs
 *
 * Lê o arquivo de log JSON gerado pelo nginx para erros de gateway (502/504).
 * O arquivo é montado via bind mount no docker-compose: /var/log/nginx → /app/nginx-logs
 *
 * Retorna as últimas N entradas em ordem decrescente (mais recentes primeiro).
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { readFile } from 'fs/promises'
import { existsSync } from 'fs'

export const dynamic = 'force-dynamic'

const LOG_PATH = '/app/nginx-logs/gateway-errors.log'
const MAX_ENTRIES = 500

interface NginxGatewayEntry {
    ts: string
    status: number
    method: string
    path: string
    duration: number  // segundos (nginx $request_time)
    ip: string
    ua: string
}

export async function GET(req: NextRequest) {
    const session = await auth()
    if (!session || session.user.role?.toLowerCase() !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!existsSync(LOG_PATH)) {
        return NextResponse.json({
            logs: [],
            available: false,
            message: 'Arquivo de log nginx não encontrado. Verifique o bind mount /var/log/nginx.',
        })
    }

    try {
        const content = await readFile(LOG_PATH, 'utf-8')
        const lines = content.trim().split('\n').filter(Boolean)

        // Pegar as últimas MAX_ENTRIES linhas e reverter (mais recentes primeiro)
        const recent = lines.slice(-MAX_ENTRIES).reverse()

        const logs: NginxGatewayEntry[] = recent.flatMap(line => {
            try {
                return [JSON.parse(line) as NginxGatewayEntry]
            } catch {
                return []
            }
        })

        const counts = {
            total: logs.length,
            s502: logs.filter(l => l.status === 502).length,
            s504: logs.filter(l => l.status === 504).length,
        }

        return NextResponse.json({ logs, counts, available: true })
    } catch {
        return NextResponse.json(
            { logs: [], available: true, counts: { total: 0, s502: 0, s504: 0 }, error: 'Erro ao ler arquivo de log' },
            { status: 500 }
        )
    }
}
