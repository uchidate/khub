/**
 * News Notification Service
 *
 * Gerencia notificações de notícias para usuários
 * - Email instantâneo quando artista favorito aparece em notícia
 * - Email digest diário/semanal
 * - Histórico de notificações
 */

import { PrismaClient } from '@prisma/client';
import { getEmailService } from './email-service';

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
            const emailService = getEmailService();
            const success = await this.sendInstantNotificationEmail(
                user.email,
                user.name || 'K-pop Fan',
                news,
                favoriteArtists
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
     * Template de email para notificação instantânea
     */
    private async sendInstantNotificationEmail(
        to: string,
        userName: string,
        news: NewsItem,
        favoriteArtists: string[]
    ): Promise<boolean> {
        const emailService = getEmailService();

        const artistsList = favoriteArtists.slice(0, 3).join(', ');
        const moreArtists = favoriteArtists.length > 3 ? ` +${favoriteArtists.length - 3}` : '';

        const newsUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.hallyuhub.com.br'}/news/${news.id}`;
        const settingsUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.hallyuhub.com.br'}/settings/notifications`;

        const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">📰 Nova Notícia!</h1>
    </div>

    <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px;">Olá, <strong>${userName}</strong>!</p>

        <p>Uma nova notícia sobre <strong>${artistsList}${moreArtists}</strong> foi publicada:</p>

        ${news.imageUrl ? `
        <div style="margin: 20px 0; text-align: center;">
            <img src="${news.imageUrl}"
                 alt="${news.title}"
                 style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        </div>
        ` : ''}

        <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0;">
            <h2 style="margin: 0 0 10px 0; font-size: 18px; color: #333;">
                ${news.title}
            </h2>
            <p style="color: #666; font-size: 14px; margin: 0;">
                📅 ${new Date(news.publishedAt).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                })}
            </p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
            <a href="${newsUrl}"
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                      color: white;
                      padding: 15px 40px;
                      text-decoration: none;
                      border-radius: 5px;
                      font-weight: bold;
                      display: inline-block;">
                Ler Notícia Completa
            </a>
        </div>

        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

        <p style="color: #666; font-size: 13px; text-align: center;">
            Você está recebendo este email porque segue ${artistsList}${moreArtists}.<br>
            <a href="${settingsUrl}" style="color: #667eea; text-decoration: none;">Gerenciar notificações</a>
        </p>

        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center;">
            <p style="color: #999; font-size: 12px; margin: 5px 0;">
                <strong>HallyuHub</strong> - Sua fonte de entretenimento coreano
            </p>
            <p style="color: #999; font-size: 12px; margin: 5px 0;">
                <a href="https://www.hallyuhub.com.br" style="color: #667eea; text-decoration: none;">www.hallyuhub.com.br</a>
            </p>
        </div>
    </div>
</body>
</html>
        `;

        const text = `
📰 Nova Notícia no HallyuHub!

Olá, ${userName}!

Uma nova notícia sobre ${artistsList}${moreArtists} foi publicada:

${news.title}

📅 ${new Date(news.publishedAt).toLocaleDateString('pt-BR')}

Leia a notícia completa em:
${newsUrl}

---
Você está recebendo este email porque segue ${artistsList}${moreArtists}.
Gerenciar notificações: ${settingsUrl}

HallyuHub - Sua fonte de entretenimento coreano
https://www.hallyuhub.com.br
        `;

        return emailService.sendEmail({
            to,
            subject: `📰 ${artistsList}${moreArtists}: ${news.title}`,
            text,
            html,
        });
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
            const emailService = getEmailService();
            return this.sendDigestEmailTemplate(
                user.email,
                user.name || 'K-pop Fan',
                news,
                frequency
            );
        } catch (error: any) {
            console.error(`❌ Error sending digest to ${userId}:`, error.message);
            return false;
        }
    }

    /**
     * Template de email digest
     */
    private async sendDigestEmailTemplate(
        to: string,
        userName: string,
        news: Array<NewsItem>,
        frequency: 'DAILY' | 'WEEKLY'
    ): Promise<boolean> {
        const emailService = getEmailService();

        const periodText = frequency === 'DAILY' ? 'hoje' : 'esta semana';
        const settingsUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.hallyuhub.com.br'}/settings/notifications`;

        const newsListHtml = news
            .map(
                (item) => `
        <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #667eea;">
            <h3 style="margin: 0 0 10px 0; font-size: 16px;">
                <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.hallyuhub.com.br'}/news/${item.id}"
                   style="color: #333; text-decoration: none;">
                    ${item.title}
                </a>
            </h3>
            <p style="color: #666; font-size: 13px; margin: 5px 0;">
                🎤 ${item.artists.map((a) => a.artist.nameRomanized).join(', ')}
            </p>
            <p style="color: #999; font-size: 12px; margin: 5px 0;">
                📅 ${new Date(item.publishedAt).toLocaleDateString('pt-BR')}
            </p>
        </div>
        `
            )
            .join('');

        const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">📬 Resumo de Notícias</h1>
    </div>

    <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px;">Olá, <strong>${userName}</strong>!</p>

        <p>Aqui estão as <strong>${news.length} notícias</strong> sobre seus artistas favoritos ${periodText}:</p>

        ${newsListHtml}

        <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.hallyuhub.com.br'}/news"
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                      color: white;
                      padding: 15px 40px;
                      text-decoration: none;
                      border-radius: 5px;
                      font-weight: bold;
                      display: inline-block;">
                Ver Todas as Notícias
            </a>
        </div>

        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

        <p style="color: #666; font-size: 13px; text-align: center;">
            <a href="${settingsUrl}" style="color: #667eea; text-decoration: none;">Gerenciar frequência do digest</a>
        </p>

        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center;">
            <p style="color: #999; font-size: 12px; margin: 5px 0;">
                <strong>HallyuHub</strong> - Sua fonte de entretenimento coreano
            </p>
            <p style="color: #999; font-size: 12px; margin: 5px 0;">
                <a href="https://www.hallyuhub.com.br" style="color: #667eea; text-decoration: none;">www.hallyuhub.com.br</a>
            </p>
        </div>
    </div>
</body>
</html>
        `;

        const frequencyLabel = frequency === 'DAILY' ? 'Diário' : 'Semanal';

        return emailService.sendEmail({
            to,
            subject: `📬 Resumo ${frequencyLabel} - ${news.length} nova${news.length > 1 ? 's' : ''} notícia${news.length > 1 ? 's' : ''}`,
            text: `
Resumo ${frequencyLabel} de Notícias - HallyuHub

Olá, ${userName}!

Aqui estão as ${news.length} notícias sobre seus artistas favoritos ${periodText}:

${news.map((item, i) => `${i + 1}. ${item.title}\n   🎤 ${item.artists.map((a) => a.artist.nameRomanized).join(', ')}\n   📅 ${new Date(item.publishedAt).toLocaleDateString('pt-BR')}`).join('\n\n')}

Ver todas as notícias: ${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.hallyuhub.com.br'}/news

---
Gerenciar frequência do digest: ${settingsUrl}

HallyuHub - Sua fonte de entretenimento coreano
https://www.hallyuhub.com.br
            `,
            html,
        });
    }
}

// Singleton
let instance: NewsNotificationService | null = null;

export function getNewsNotificationService(prisma?: PrismaClient): NewsNotificationService {
    if (!instance || prisma) {
        const { PrismaClient: PC } = require('@prisma/client');
        instance = new NewsNotificationService(prisma || new PC());
    }
    return instance;
}
