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
 * AÇÕES:
 * - POST /api/cron/translate-news         → traduz batch de 10 notícias pending
 * - POST /api/cron/translate-news?action=retry → reprocessa failed (reset → pending → traduz)
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

    try {
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

        log.info(`Starting news translation job`, { action });

        const translationService = getNewsTranslationService(prisma);
        let result: { translated: number; failed: number; skipped: number };

        if (action === 'retry') {
            // Reprocessar notícias com falha
            const retranslated = await translationService.retryFailedTranslations(10);
            result = { translated: retranslated, failed: 0, skipped: 0 };
        } else {
            // Traduzir notícias pendentes
            result = await translationService.translatePendingNews(10);
        }

        // Estatísticas gerais
        const stats = await translationService.getTranslationStats();

        log.info('News translation job completed', { result, stats });

        return NextResponse.json({
            success: true,
            message: 'News translation completed',
            requestId,
            action,
            timestamp: new Date().toISOString(),
            results: {
                translated: result.translated,
                failed: result.failed,
                skipped: result.skipped,
            },
            stats: {
                pending: stats.pending,
                completed: stats.completed,
                failed: stats.failed,
                total: stats.total,
            }
        });

    } catch (error: any) {
        log.error('News translation job failed', {
            error: error.message,
            stack: error.stack
        });

        return NextResponse.json({
            success: false,
            error: 'News translation job failed',
            message: error.message,
            requestId,
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }
}

export async function GET() {
    return NextResponse.json({
        error: 'Method not allowed. Use POST.',
        hint: 'POST /api/cron/translate-news?action=translate|retry'
    }, { status: 405 });
}
