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
            console.error('[DIGEST] ❌ CRON_SECRET not configured');
            return NextResponse.json(
                { error: 'CRON_SECRET not configured' },
                { status: 500 }
            );
        }

        if (authHeader !== `Bearer ${cronSecret}`) {
            console.error('[DIGEST] ❌ Unauthorized access attempt');
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        console.log('[DIGEST] 📬 Starting email digest cron job...');

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

        console.log(`[DIGEST] Found ${users.length} users with ${frequency} digest enabled`);

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
            console.log(`[DIGEST] ✅ No users to notify (${duration}ms)`);
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
                console.log(`[DIGEST] Sending ${frequency} digest to ${user.email}...`);
                const success = await notificationService.sendDigestEmail(user.id, frequency);

                if (success) {
                    result.sent++;
                    console.log(`[DIGEST] ✅ Sent to ${user.email}`);
                } else {
                    result.skipped++;
                    console.log(`[DIGEST] ⏭️  Skipped ${user.email} (no news or disabled)`);
                }
            } catch (error: any) {
                result.failed++;
                const errorMsg = `${user.email}: ${error.message}`;
                result.errors.push(errorMsg);
                console.error(`[DIGEST] ❌ Failed for ${user.email}:`, error.message);
            }
        }

        const duration = Date.now() - startTime;

        console.log(`[DIGEST] ✅ Digest job completed in ${duration}ms`);
        console.log(`[DIGEST]    Sent: ${result.sent}`);
        console.log(`[DIGEST]    Skipped: ${result.skipped}`);
        console.log(`[DIGEST]    Failed: ${result.failed}`);

        return NextResponse.json({
            success: true,
            result,
            duration,
        });
    } catch (error: any) {
        const duration = Date.now() - startTime;
        console.error('[DIGEST] ❌ Digest job failed:', error);

        return NextResponse.json(
            {
                success: false,
                error: error.message,
                duration,
            },
            { status: 500 }
        );
    }
}
