import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import prisma from '@/lib/prisma';
import { getNewsTranslationService } from '@/lib/services/news-translation-service';

/**
 * Cron Job - Traduzir Notícias Pendentes
 *
 * Endpoint para traduzir notícias de EN/KR → PT-BR usando Ollama em batch.
 * Processo separado do discovery (RSS fetch) para melhor performance e controle.
 *
 * AUTENTICAÇÃO: Requer CRON_SECRET via header Authorization: Bearer ou ?token=
 *
 * RETORNO: 202 Accepted imediatamente — processamento continua em background.
 * (Nginx tem timeout de 60s; Ollama pode levar >60s para traduzir 10 notícias)
 *
 * AÇÕES:
 * - POST /api/cron/translate-news               → traduz batch de 10 notícias pending
 * - POST /api/cron/translate-news?action=retry  → reprocessa failed (reset → pending → traduz)
 * - POST /api/cron/translate-news?action=reset-old → reseta notícias antigas (sem originalContent)
 *                                                     para retradução com conteúdo original preservado
 */
export async function POST(request: NextRequest) {
    const requestId = `cron-news-translate-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

    const log = {
        info: (message: string, context?: any) => {
            console.log(JSON.stringify({
                timestamp: new Date().toISOString(),
                level: 'info',
                service: 'CRON_TRANSLATE_NEWS',
                message,
                requestId,
                ...context
            }));
        },
        error: (message: string, context?: any) => {
            console.error(JSON.stringify({
                timestamp: new Date().toISOString(),
                level: 'error',
                service: 'CRON_TRANSLATE_NEWS',
                message,
                requestId,
                ...context
            }));
        }
    };

    // 1. Verificar autenticação
    const authToken = request.headers.get('authorization')?.replace('Bearer ', '') ||
                     request.nextUrl.searchParams.get('token');
    const expectedToken = process.env.CRON_SECRET || process.env.NEXTAUTH_SECRET;

    if (!expectedToken) {
        log.error('CRON_SECRET not configured');
        return NextResponse.json({ success: false, error: 'Cron secret not configured' }, { status: 500 });
    }

    const tokenValid = authToken !== null
        && authToken.length === expectedToken.length
        && timingSafeEqual(Buffer.from(authToken), Buffer.from(expectedToken));

    if (!tokenValid) {
        log.error('Unauthorized access attempt');
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const action = request.nextUrl.searchParams.get('action') || 'translate';

    log.info(`Starting news translation job in background`, { action });

    // 2. Disparar processamento em background (fire-and-forget)
    // O Node.js standalone mantém o processo vivo, então a Promise executa até o fim
    // Nginx tem timeout de 60s — Ollama leva >60s para traduzir 10 notícias, então
    // precisamos retornar 202 imediatamente e processar em background.
    runTranslationProcessing(prisma, action, requestId, log).catch(err => {
        log.error('Unhandled error in background translation processing', {
            error: err instanceof Error ? err.message : String(err)
        });
    });

    // 3. Retornar 202 imediatamente (antes do timeout do nginx de 60s)
    return NextResponse.json({
        status: 'accepted',
        message: 'News translation started in background',
        requestId,
        action,
        timestamp: new Date().toISOString(),
    }, { status: 202 });
}

/**
 * Processamento assíncrono em background.
 * Traduz notícias pendentes e loga resultados.
 */
async function runTranslationProcessing(
    prismaClient: typeof prisma,
    action: string,
    requestId: string,
    log: { info: (msg: string, ctx?: any) => void; error: (msg: string, ctx?: any) => void }
) {
    const startTime = Date.now();

    try {
        const translationService = getNewsTranslationService(prismaClient);
        let result: { translated: number; failed: number; skipped: number };

        if (action === 'retry') {
            // Reprocessar notícias com falha
            const retranslated = await translationService.retryFailedTranslations(10);
            result = { translated: retranslated, failed: 0, skipped: 0 };
        } else if (action === 'reset-old') {
            // Resetar notícias antigas (sem originalContent) para retradução
            const resetCount = await translationService.resetOldNewsForRetranslation();
            // Depois do reset, traduzir o próximo batch
            result = await translationService.translatePendingNews(10);
            console.log(`♻️  Reset ${resetCount} old news + translated first batch`);
        } else {
            // Traduzir notícias pendentes
            result = await translationService.translatePendingNews(10);
        }

        // Estatísticas gerais
        const stats = await translationService.getTranslationStats();
        const duration = Math.round((Date.now() - startTime) / 1000);

        log.info('News translation job completed', { result, stats, duration_s: duration });

    } catch (error: any) {
        const duration = Math.round((Date.now() - startTime) / 1000);
        log.error('News translation job failed', {
            error: error.message,
            stack: error.stack,
            duration_s: duration
        });
    }
}

export async function GET() {
    return NextResponse.json({
        error: 'Method not allowed. Use POST.',
        hint: 'POST /api/cron/translate-news?action=translate|retry|reset-old'
    }, { status: 405 });
}
