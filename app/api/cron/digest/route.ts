/**
 * Cron Job: Email Digest (Diário/Semanal)
 *
 * Envia resumo de notícias para usuários que têm digest ativado
 *
 * Execução:
 * - Diário: 09:00 (horário configurável por usuário)
 * - Semanal: Segunda-feira 09:00
 *
 * Segurança:
 * - Requer CRON_SECRET para execução
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getNewsNotificationService } from '@/lib/services/news-notification-service';
import { createLogger } from '@/lib/utils/logger';
import { getErrorMessage } from '@/lib/utils/error';

const log = createLogger('DIGEST');

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutos

interface DigestResult {
    frequency: 'DAILY' | 'WEEKLY';
    totalUsers: number;
    sent: number;
    failed: number;
    skipped: number;
    errors: string[];
}

export async function GET(request: NextRequest) {
    const startTime = Date.now();

    try {
        // Segurança: Verificar CRON_SECRET
        const authHeader = request.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET;

        if (!cronSecret) {
            log.error('CRON_SECRET not configured');
            return NextResponse.json(
                { error: 'CRON_SECRET not configured' },
                { status: 500 }
            );
        }

        if (authHeader !== `Bearer ${cronSecret}`) {
            log.error('Unauthorized access attempt');
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        log.info('Starting email digest cron job');

        const { searchParams } = new URL(request.url);
        const frequency = (searchParams.get('frequency') || 'DAILY').toUpperCase() as 'DAILY' | 'WEEKLY';

        if (!['DAILY', 'WEEKLY'].includes(frequency)) {
            return NextResponse.json(
                { error: 'Invalid frequency. Use DAILY or WEEKLY' },
                { status: 400 }
            );
        }

        // Buscar usuários que têm digest ativado para esta frequência
        const users = await prisma.user.findMany({
            where: {
                notificationSettings: {
                    emailDigestEnabled: true,
                    emailDigestFrequency: frequency,
                },
            },
            select: {
                id: true,
                email: true,
                name: true,
            },
        });

        log.info('Found users for digest', { count: users.length, frequency });

        const result: DigestResult = {
            frequency,
            totalUsers: users.length,
            sent: 0,
            failed: 0,
            skipped: 0,
            errors: [],
        };

        if (users.length === 0) {
            const duration = Date.now() - startTime;
            log.info('No users to notify', { duration });
            return NextResponse.json({
                success: true,
                result,
                duration,
            });
        }

        // Enviar digest para cada usuário
        const notificationService = getNewsNotificationService();

        for (const user of users) {
            try {
                log.info('Sending digest email', { frequency, email: user.email });
                const success = await notificationService.sendDigestEmail(user.id, frequency);

                if (success) {
                    result.sent++;
                    log.info('Digest sent', { email: user.email });
                } else {
                    result.skipped++;
                    log.info('Digest skipped', { email: user.email, reason: 'no news or disabled' });
                }
            } catch (error: unknown) {
                result.failed++;
                const errorMsg = `${user.email}: ${getErrorMessage(error)}`;
                result.errors.push(errorMsg);
                log.error('Digest failed for user', { email: user.email, error: getErrorMessage(error) });
            }
        }

        const duration = Date.now() - startTime;

        log.info('Digest job completed', { duration, sent: result.sent, skipped: result.skipped, failed: result.failed });

        return NextResponse.json({
            success: true,
            result,
            duration,
        });
    } catch (error: unknown) {
        const duration = Date.now() - startTime;
        log.error('Digest job failed', { error: getErrorMessage(error), duration });

        return NextResponse.json(
            {
                success: false,
                error: 'Internal server error',
                duration,
            },
            { status: 500 }
        );
    }
}
