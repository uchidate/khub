import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: { notificationSettings: true },
    });

    if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
        settings: user.notificationSettings,
    });
}

export async function PUT(request: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true },
    });

    if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    try {
        const body = await request.json();

        const {
            emailOnNewNews,
            emailDigestEnabled,
            emailDigestFrequency,
            emailDigestTime,
            onlyFavoriteArtists,
            minNewsImportance,
        } = body;

        // Validações
        if (typeof emailOnNewNews !== 'boolean') {
            return NextResponse.json(
                { error: 'emailOnNewNews must be boolean' },
                { status: 400 }
            );
        }

        if (typeof emailDigestEnabled !== 'boolean') {
            return NextResponse.json(
                { error: 'emailDigestEnabled must be boolean' },
                { status: 400 }
            );
        }

        if (!['DAILY', 'WEEKLY', 'NEVER'].includes(emailDigestFrequency)) {
            return NextResponse.json(
                { error: 'Invalid emailDigestFrequency' },
                { status: 400 }
            );
        }

        // Validar formato de hora (HH:mm)
        if (!/^\d{2}:\d{2}$/.test(emailDigestTime)) {
            return NextResponse.json(
                { error: 'Invalid emailDigestTime format. Use HH:mm' },
                { status: 400 }
            );
        }

        // Atualizar ou criar configurações
        const settings = await prisma.userNotificationSettings.upsert({
            where: { userId: user.id },
            update: {
                emailOnNewNews,
                emailDigestEnabled,
                emailDigestFrequency,
                emailDigestTime,
                onlyFavoriteArtists: onlyFavoriteArtists ?? true,
                minNewsImportance: minNewsImportance || 'ALL',
            },
            create: {
                userId: user.id,
                emailOnNewNews,
                emailDigestEnabled,
                emailDigestFrequency,
                emailDigestTime,
                onlyFavoriteArtists: onlyFavoriteArtists ?? true,
                minNewsImportance: minNewsImportance || 'ALL',
            },
        });

        return NextResponse.json({
            success: true,
            settings,
        });
    } catch (error: any) {
        console.error('Error updating notification settings:', error);
        return NextResponse.json(
            { error: 'Failed to update settings', details: error.message },
            { status: 500 }
        );
    }
}
