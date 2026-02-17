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
 * RETORNO: 202 Accepted imediatamente — processamento continua em background.
 * (Nginx tem timeout de 60s; Ollama pode levar >60s para traduzir 5 artistas)
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

    log.info('Starting artist translation job in background', { requestId });

    // 2. Disparar processamento em background (fire-and-forget)
    // O Node.js standalone mantém o processo vivo, então a Promise executa até o fim
    // Nginx tem timeout de 60s — Ollama leva >60s para traduzir 5 artistas, então
    // precisamos retornar 202 imediatamente e processar em background.
    runTranslationProcessing(prisma, requestId, log).catch(err => {
        log.error('Unhandled error in background translation processing', {
            error: err instanceof Error ? err.message : String(err)
        });
    });

    // 3. Retornar 202 imediatamente (antes do timeout do nginx de 60s)
    return NextResponse.json({
        status: 'accepted',
        message: 'Artist translation started in background',
        requestId,
        timestamp: new Date().toISOString(),
    }, { status: 202 });
}

/**
 * Processamento assíncrono em background.
 * Traduz biografias de artistas pendentes e loga resultados.
 */
async function runTranslationProcessing(
    prismaClient: typeof prisma,
    requestId: string,
    log: { info: (msg: string, ctx?: any) => void; error: (msg: string, ctx?: any) => void }
) {
    const startTime = Date.now();

    try {
        const translationService = getArtistTranslationService(prismaClient);

        // Processar traduções em batch (5 artistas por vez)
        const result = await translationService.translatePendingArtists(5);

        // Obter estatísticas
        const stats = await translationService.getTranslationStats();
        const duration = Math.round((Date.now() - startTime) / 1000);

        log.info('Artist translation job completed', { result, stats, duration_s: duration });

    } catch (error: any) {
        const duration = Math.round((Date.now() - startTime) / 1000);
        log.error('Translation job failed', {
            error: error.message,
            stack: error.stack,
            duration_s: duration
        });
    }
}

// Permitir apenas POST
export async function GET() {
    return NextResponse.json({
        error: 'Method not allowed. Use POST.'
    }, { status: 405 });
}
