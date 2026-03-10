/**
 * News Notification Service
 *
 * Gerencia notificações de notícias para usuários
 * - Email instantâneo quando artista favorito aparece em notícia
 * - Email digest diário/semanal
 * - Histórico de notificações
 */

import { PrismaClient } from '@prisma/client';
import { sendNewsInstantEmail, sendNewsDigestEmail } from './email-service';
import prismaSingleton from '@/lib/prisma';

interface NewsItem {
    id: string;
    title: string;
    imageUrl: string | null;
    publishedAt: Date;
    sourceUrl: string;
    artists: Array<{
        artist: {
            id: string;
            nameRomanized: string;
        };
    }>;
}

interface UserSettings {
    id: string;
    email: string;
    name: string | null;
    notificationSettings: {
        emailOnNewNews: boolean;
        emailDigestEnabled: boolean;
        emailDigestFrequency: string;
        onlyFavoriteArtists: boolean;
    } | null;
    favorites: Array<{
        artist: {
            nameRomanized: string;
        } | null;
    }>;
}

/**
 * Serviço de Notificações de Notícias
 */
export class NewsNotificationService {
    private prisma: PrismaClient;

    constructor(prisma: PrismaClient) {
        this.prisma = prisma;
    }

    /**
     * Envia notificação instantânea quando nova notícia menciona artista favorito
     */
    async notifyUsersAboutNews(newsId: string): Promise<void> {
        try {
            // 1. Buscar notícia com artistas mencionados
            const news = await this.prisma.news.findUnique({
                where: { id: newsId },
                include: {
                    artists: {
                        include: {
                            artist: {
                                select: {
                                    id: true,
                                    nameRomanized: true,
                                },
                            },
                        },
                    },
                },
            });

            if (!news || news.artists.length === 0) {
                console.log(`  ⏭️  News ${newsId} has no artists, skipping notifications`);
                return;
            }

            const artistIds = news.artists.map((a) => a.artist.id);

            // 2. Buscar usuários que têm esses artistas como favoritos E têm notificações ativadas
            const users = await this.prisma.user.findMany({
                where: {
                    favorites: {
                        some: {
                            artistId: {
                                in: artistIds,
                            },
                        },
                    },
                },
                include: {
                    notificationSettings: true,
                    favorites: {
                        where: {
                            artistId: {
                                in: artistIds,
                            },
                        },
                        include: {
                            artist: {
                                select: {
                                    nameRomanized: true,
                                },
                            },
                        },
                    },
                },
            });

            if (users.length === 0) {
                console.log(`  ⏭️  No users follow these artists, skipping notifications`);
                return;
            }

            console.log(`  📬 Sending notifications to ${users.length} user(s) about: ${news.title}`);

            // 3. Enviar notificação para cada usuário (se configurado)
            for (const user of users) {
                await this.sendNewsNotificationToUser(user, news);
            }
        } catch (error: any) {
            console.error(`❌ Error notifying users about news ${newsId}:`, error.message);
        }
    }

    /**
     * Cria notificações IN_APP para todos os usuários que favoritaram artistas da notícia
     */
    async notifyInAppForNews(newsId: string): Promise<void> {
        try {
            const news = await this.prisma.news.findUnique({
                where: { id: newsId },
                include: { artists: { include: { artist: { select: { id: true } } } } },
            });

            if (!news || news.artists.length === 0) return;

            const artistIds = news.artists.map((a) => a.artist.id);

            const users = await this.prisma.user.findMany({
                where: { favorites: { some: { artistId: { in: artistIds } } } },
                select: { id: true },
            });

            if (users.length === 0) return;

            // Find users already notified to skip them
            const alreadyNotified = await this.prisma.notificationHistory.findMany({
                where: { newsId, type: 'IN_APP', userId: { in: users.map(u => u.id) } },
                select: { userId: true },
            });
            const alreadyNotifiedIds = new Set(alreadyNotified.map(n => n.userId));
            const newUsers = users.filter(u => !alreadyNotifiedIds.has(u.id));
            if (newUsers.length === 0) return;

            await this.prisma.notificationHistory.createMany({
                data: newUsers.map(u => ({
                    userId: u.id,
                    newsId,
                    type: 'IN_APP',
                    status: 'SENT',
                    sentAt: new Date(),
                })),
                skipDuplicates: true,
            });

            console.log(`  🔔 IN_APP notifications created for ${users.length} user(s) about: ${news.title}`);
        } catch (error: unknown) {
            console.error(`❌ Error creating IN_APP notifications for news ${newsId}:`, error);
        }
    }

    /**
     * Envia email de notificação individual
     */
    private async sendNewsNotificationToUser(user: UserSettings, news: NewsItem): Promise<void> {
        try {
            // Verificar se usuário tem notificações ativadas
            if (!user.notificationSettings?.emailOnNewNews) {
                console.log(`  ⏭️  User ${user.email} has instant notifications disabled`);
                return;
            }

            // Verificar se já enviamos notificação para este usuário sobre esta notícia
            const alreadyNotified = await this.prisma.notificationHistory.findFirst({
                where: {
                    userId: user.id,
                    newsId: news.id,
                    type: 'EMAIL_INSTANT',
                },
            });

            if (alreadyNotified) {
                console.log(`  ⏭️  User ${user.email} already notified about this news`);
                return;
            }

            // Encontrar artistas favoritos mencionados nesta notícia
            const favoriteArtists = user.favorites
                .filter((f) => f.artist)
                .map((f) => f.artist!.nameRomanized);

            if (favoriteArtists.length === 0) {
                console.log(`  ⏭️  No favorite artists mentioned for ${user.email}`);
                return;
            }

            // Enviar email
            const success = await this.sendInstantNotificationEmail(
                user.email,
                user.name || 'K-pop Fan',
                news,
                favoriteArtists,
                user.id
            );

            // Registrar no histórico
            await this.prisma.notificationHistory.create({
                data: {
                    userId: user.id,
                    newsId: news.id,
                    type: 'EMAIL_INSTANT',
                    status: success ? 'SENT' : 'FAILED',
                    sentAt: success ? new Date() : null,
                    errorMessage: success ? null : 'Failed to send email',
                },
            });

            if (success) {
                console.log(`  ✅ Notification sent to ${user.email}`);
            } else {
                console.log(`  ❌ Failed to send notification to ${user.email}`);
            }
        } catch (error: any) {
            console.error(`❌ Error sending notification to ${user.email}:`, error.message);

            // Registrar falha no histórico
            try {
                await this.prisma.notificationHistory.create({
                    data: {
                        userId: user.id,
                        newsId: news.id,
                        type: 'EMAIL_INSTANT',
                        status: 'FAILED',
                        errorMessage: error.message,
                    },
                });
            } catch (e) {
                console.error('Failed to record notification failure:', e);
            }
        }
    }

    /**
     * Envia email de notificação instantânea via template do banco de dados
     */
    private async sendInstantNotificationEmail(
        to: string,
        userName: string,
        news: NewsItem,
        favoriteArtists: string[],
        userId?: string
    ): Promise<boolean> {
        const artistsList = favoriteArtists.slice(0, 3).join(', ');
        const moreArtists = favoriteArtists.length > 3 ? ` +${favoriteArtists.length - 3}` : '';
        const artists = `${artistsList}${moreArtists}`;
        return sendNewsInstantEmail(to, userName, news.title, news.id, artists, userId);
    }

    /**
     * Envia email digest diário/semanal
     */
    async sendDigestEmail(userId: string, frequency: 'DAILY' | 'WEEKLY'): Promise<boolean> {
        try {
            // Buscar usuário e configurações
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
                include: {
                    notificationSettings: true,
                    favorites: {
                        where: { artistId: { not: null } },
                        select: { artistId: true },
                    },
                },
            });

            if (!user || !user.notificationSettings?.emailDigestEnabled) {
                return false;
            }

            if (user.notificationSettings.emailDigestFrequency !== frequency) {
                return false;
            }

            const favoriteArtistIds = user.favorites
                .map((f) => f.artistId)
                .filter((id): id is string => id !== null);

            if (favoriteArtistIds.length === 0) {
                return false;
            }

            // Buscar notícias dos últimos 1 dia (DAILY) ou 7 dias (WEEKLY)
            const daysAgo = frequency === 'DAILY' ? 1 : 7;
            const since = new Date();
            since.setDate(since.getDate() - daysAgo);

            const news = await this.prisma.news.findMany({
                where: {
                    publishedAt: { gte: since },
                    artists: {
                        some: {
                            artistId: { in: favoriteArtistIds },
                        },
                    },
                },
                include: {
                    artists: {
                        include: {
                            artist: {
                                select: {
                                    id: true,
                                    nameRomanized: true,
                                },
                            },
                        },
                    },
                },
                orderBy: { publishedAt: 'desc' },
                take: 10, // Máximo 10 notícias no digest
            });

            if (news.length === 0) {
                console.log(`  ⏭️  No news for user ${user.email} in the last ${daysAgo} days`);
                return false;
            }

            // Enviar digest
            return this.sendDigestEmailTemplate(
                user.email,
                user.name || 'K-pop Fan',
                news,
                frequency,
                userId
            );
        } catch (error: any) {
            console.error(`❌ Error sending digest to ${userId}:`, error.message);
            return false;
        }
    }

    /**
     * Envia email digest via template do banco de dados
     */
    private async sendDigestEmailTemplate(
        to: string,
        userName: string,
        news: Array<NewsItem>,
        frequency: 'DAILY' | 'WEEKLY',
        userId?: string
    ): Promise<boolean> {
        const period = frequency === 'DAILY' ? 'hoje' : 'esta semana';
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.hallyuhub.com.br';

        const newsListHtml = news.map((item) => `
        <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #a855f7;">
            <h3 style="margin: 0 0 8px 0; font-size: 15px;">
                <a href="${siteUrl}/news/${item.id}" style="color: #18181b; text-decoration: none;">
                    ${item.title}
                </a>
            </h3>
            <p style="color: #71717a; font-size: 13px; margin: 4px 0;">
                🎤 ${item.artists.map((a) => a.artist.nameRomanized).join(', ')}
            </p>
            <p style="color: #a1a1aa; font-size: 12px; margin: 4px 0;">
                📅 ${new Date(item.publishedAt).toLocaleDateString('pt-BR')}
            </p>
        </div>`).join('');

        return sendNewsDigestEmail(to, userName, period, newsListHtml, userId);
    }
}

// Singleton — always uses the shared prisma singleton to avoid extra connection pools
let instance: NewsNotificationService | null = null;

export function getNewsNotificationService(prisma?: PrismaClient): NewsNotificationService {
    if (!instance || prisma) {
        instance = new NewsNotificationService(prisma ?? prismaSingleton);
    }
    return instance;
}
