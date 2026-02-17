import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import prisma from '@/lib/prisma';
import { getArtistTranslationService } from '@/lib/services/artist-translation-service';

/**
 * Cron Job - Traduzir Biografias de Artistas
 *
 * Endpoint para traduzir biografias de artistas de EN/KR → PT usando Ollama
 * Processa em batch para otimizar performance
 *
 * AUTENTICAÇÃO: Requer CRON_SECRET via header ou query param
 *
 * Processo separado do discovery para:
 * - Discovery rápido sem esperar Ollama
 * - Tradução batch otimizada
 * - Melhor controle de recursos
 */
export async function POST(request: NextRequest) {
    const requestId = `cron-translate-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

    const log = {
        info: (message: string, context?: any) => {
            console.log(JSON.stringify({
                timestamp: new Date().toISOString(),
                level: 'info',
                service: 'CRON_TRANSLATE',
                message,
                requestId,
                ...context
            }));
        },
        error: (message: string, context?: any) => {
            console.error(JSON.stringify({
                timestamp: new Date().toISOString(),
                level: 'error',
                service: 'CRON_TRANSLATE',
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
            return NextResponse.json({
                success: false,
                error: 'Cron secret not configured'
            }, { status: 500 });
        }

        // Timing-safe comparison to prevent timing attacks
        const tokenValid = authToken !== null
            && authToken.length === expectedToken.length
            && timingSafeEqual(Buffer.from(authToken), Buffer.from(expectedToken));

        if (!tokenValid) {
            log.error('Unauthorized access attempt');
            return NextResponse.json({
                success: false,
                error: 'Unauthorized'
            }, { status: 401 });
        }

        log.info('Starting artist translation job', { requestId });

        // 2. Processar traduções em batch (5 artistas por vez)
        const translationService = getArtistTranslationService(prisma);

        const result = await translationService.translatePendingArtists(5);

        // 3. Obter estatísticas
        const stats = await translationService.getTranslationStats();

        log.info('Translation job completed', {
            result,
            stats
        });

        // 4. Retornar sucesso
        return NextResponse.json({
            success: true,
            message: 'Artist translation completed',
            requestId,
            timestamp: new Date().toISOString(),
            results: {
                translated: result.translated,
                failed: result.failed,
                skipped: result.skipped
            },
            stats: {
                pending: stats.pending,
                completed: stats.completed,
                failed: stats.failed,
                total: stats.total
            }
        });

    } catch (error: any) {
        log.error('Translation job failed', {
            error: error.message,
            stack: error.stack
        });

        return NextResponse.json({
            success: false,
            error: 'Translation job failed',
            message: error.message,
            requestId,
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }
}

// Permitir apenas POST
export async function GET() {
    return NextResponse.json({
        error: 'Method not allowed. Use POST.'
    }, { status: 405 });
}
