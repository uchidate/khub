/**
 * Slack Notification Service
 * Centralized service for sending notifications to Slack channels
 *
 * Channels:
 * - #hallyuhub-content: New artists, news, films, series
 * - #hallyuhub-deploys: Deploy status (staging/production)
 * - #hallyuhub-alerts: Backups, health alerts, errors
 */

export type ContentType = 'artist' | 'news' | 'production' | 'agency' | 'filmography';
export type DeployEnvironment = 'staging' | 'production';
export type DeployStatus = 'started' | 'success' | 'failed';
export type BackupStatus = 'success' | 'failed';
export type AlertSeverity = 'info' | 'warning' | 'error';
export type ActionSource = 'admin' | 'cron' | 'api' | 'manual' | 'system';

interface UserContext {
    name?: string;
    email?: string;
    role?: string;
}

interface ActionContext {
    source: ActionSource;
    user?: UserContext;
    timestamp?: Date;
    triggeredBy?: string; // Generic field for any trigger description
}

interface ContentNotification {
    type: ContentType;
    name: string;
    details?: Record<string, string | number | null>;
    source?: string;
    url?: string;
    context?: ActionContext;
    totalCount?: number; // Optional total count in database
}

interface DeployNotification {
    environment: DeployEnvironment;
    status: DeployStatus;
    branch?: string;
    commit?: string;
    commitMessage?: string;
    duration?: string;
    error?: string;
    workflowUrl?: string;
    repoUrl?: string;
    context?: ActionContext;
}

interface BackupNotification {
    environment: DeployEnvironment;
    status: BackupStatus;
    size?: string;
    retainedCount?: number;
    error?: string;
    context?: ActionContext;
}

interface HealthAlertNotification {
    service: string;
    status: 'up' | 'down' | 'degraded';
    message?: string;
    context?: ActionContext;
}

interface SlackBlock {
    type: string;
    text?: {
        type: string;
        text: string;
        emoji?: boolean;
    };
    fields?: Array<{
        type: string;
        text: string;
    }>;
    elements?: Array<{
        type: string;
        text?: string;
        url?: string;
    }>;
}

export class SlackNotificationService {
    private webhookContent: string | null;
    private webhookDeploys: string | null;
    private webhookAlerts: string | null;
    private siteUrl: string;
    private githubRepo: string;

    constructor() {
        this.webhookContent = process.env.SLACK_WEBHOOK_CONTENT || null;
        this.webhookDeploys = process.env.SLACK_WEBHOOK_DEPLOYS || null;
        this.webhookAlerts = process.env.SLACK_WEBHOOK_ALERTS || null;
        this.siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
        this.githubRepo = process.env.GITHUB_REPOSITORY || 'uchidate/khub';

        if (!this.webhookContent && !this.webhookDeploys && !this.webhookAlerts) {
            console.log('[SlackNotificationService] No webhooks configured - notifications disabled');
        }
    }

    /**
     * Check if any webhook is configured
     */
    isEnabled(): boolean {
        return !!(this.webhookContent || this.webhookDeploys || this.webhookAlerts);
    }

    /**
     * Notify when new content is added (artists, news, productions, filmography)
     */
    async notifyContentAdded(content: ContentNotification): Promise<boolean> {
        if (!this.webhookContent) return false;

        const emoji = this.getContentEmoji(content.type);
        const typeLabel = this.getContentTypeLabel(content.type);

        const blocks: SlackBlock[] = [
            {
                type: 'header',
                text: {
                    type: 'plain_text',
                    text: `${emoji} Novo ${typeLabel} Adicionado`,
                    emoji: true,
                },
            },
            {
                type: 'section',
                fields: [
                    { type: 'mrkdwn', text: `*Nome:*\n${content.name}` },
                    { type: 'mrkdwn', text: `*Tipo:*\n${typeLabel}` },
                ],
            },
        ];

        // Add details if provided
        if (content.details) {
            const detailFields = Object.entries(content.details)
                .filter(([, value]) => value !== null && value !== undefined)
                .slice(0, 4)
                .map(([key, value]) => ({
                    type: 'mrkdwn',
                    text: `*${key}:*\n${value}`,
                }));

            if (detailFields.length > 0) {
                blocks.push({
                    type: 'section',
                    fields: detailFields,
                });
            }
        }

        // Add divider before links/context
        blocks.push({ type: 'divider' });

        // Build links array
        const links: Array<{ label: string; url: string }> = [];
        if (content.url) {
            links.push({ label: '🌐 Ver no site', url: content.url });
        }
        if (content.source && content.source.startsWith('http')) {
            links.push({ label: '📄 Fonte', url: content.source });
        }

        // Add links block
        const linksBlock = this.buildLinksBlock(links);
        if (linksBlock) {
            blocks.push(linksBlock);
        }

        // Add context block (timestamp, user, source)
        const contextBlock = this.buildContextBlock(content.context);
        if (contextBlock) {
            blocks.push(contextBlock);
        }

        return this.sendMessage(this.webhookContent, { blocks });
    }

    /**
     * Notify batch content creation summary
     */
    async notifyContentBatchSummary(summary: {
        artists: number;
        news: number;
        productions: number;
        filmographies?: number;
        provider: string;
        duration?: string;
        context?: ActionContext;
        totalArtists?: number;
    }): Promise<boolean> {
        if (!this.webhookContent) return false;

        const total = summary.artists + summary.news + summary.productions + (summary.filmographies || 0);
        if (total === 0) return false;

        const blocks: SlackBlock[] = [
            {
                type: 'header',
                text: {
                    type: 'plain_text',
                    text: '📊 Resumo de Conteúdo Gerado',
                    emoji: true,
                },
            },
            {
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: `*Total:* ${total} itens adicionados${summary.totalArtists ? ` (Total no Hub: ${summary.totalArtists})` : ''}`
                }
            },
            {
                type: 'section',
                fields: [
                    { type: 'mrkdwn', text: `*🎤 Artistas:*\n${summary.artists}` },
                    { type: 'mrkdwn', text: `*📰 Notícias:*\n${summary.news}` },
                    { type: 'mrkdwn', text: `*🎬 Produções:*\n${summary.productions}` },
                    { type: 'mrkdwn', text: `*🤖 Provider:*\n${summary.provider}` },
                ],
            },
        ];

        // Add filmographies if any
        if (summary.filmographies && summary.filmographies > 0) {
            blocks.push({
                type: 'section',
                fields: [
                    { type: 'mrkdwn', text: `*🎞️ Filmografias:*\n${summary.filmographies}` }
                ]
            });
        }

        // Add divider
        blocks.push({ type: 'divider' });

        // Duration in context
        if (summary.duration) {
            blocks.push({
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: `⏱️ *Duração:* ${summary.duration}`
                }
            });
        }

        // Context block
        const contextBlock = this.buildContextBlock(summary.context);
        if (contextBlock) {
            blocks.push(contextBlock);
        }

        return this.sendMessage(this.webhookContent, { blocks });
    }

    /**
     * Notify cron job completion with summary
     */
    async notifyCronJobComplete(job: {
        duration: number;
        updates: number;
        errors: number;
        details: {
            artists: { updated: number; errors: string[] };
            news: { updated: number; errors: string[] };
            filmography: { synced: number; errors: string[] };
            trending: { updated: number; errors: string[] };
        };
    }): Promise<boolean> {
        // Use webhookContent if available, fallback to webhookDeploys
        const webhook = this.webhookContent || this.webhookDeploys;
        if (!webhook) return false;

        // Don't notify if nothing happened
        if (job.updates === 0 && job.errors === 0) return false;

        const emoji = job.errors > 0 ? '⚠️' : '✅';
        const durationStr = (job.duration / 1000).toFixed(1) + 's';

        const blocks: SlackBlock[] = [
            {
                type: 'header',
                text: {
                    type: 'plain_text',
                    text: `${emoji} Cron Job Completo`,
                    emoji: true,
                },
            },
            {
                type: 'section',
                fields: [
                    { type: 'mrkdwn', text: `*⏱️ Duração:*\n${durationStr}` },
                    { type: 'mrkdwn', text: `*✅ Updates:*\n${job.updates}` },
                    { type: 'mrkdwn', text: `*❌ Erros:*\n${job.errors}` },
                ],
            },
        ];

        // Add details
        if (job.details) {
            const detailFields = [];
            if (job.details.artists.updated > 0) {
                detailFields.push({ type: 'mrkdwn', text: `*🎤 Artistas:*\n${job.details.artists.updated}` });
            }
            if (job.details.news.updated > 0) {
                detailFields.push({ type: 'mrkdwn', text: `*📰 Notícias:*\n${job.details.news.updated}` });
            }
            if (job.details.filmography.synced > 0) {
                detailFields.push({ type: 'mrkdwn', text: `*🎞️ Filmografias:*\n${job.details.filmography.synced}` });
            }
            if (job.details.trending.updated > 0) {
                detailFields.push({ type: 'mrkdwn', text: `*📊 Trending:*\nAtualizado` });
            }

            if (detailFields.length > 0) {
                blocks.push({
                    type: 'section',
                    fields: detailFields,
                });
            }
        }

        // Add errors if any
        if (job.errors > 0 && job.details) {
            blocks.push({ type: 'divider' });
            const allErrors = [
                ...job.details.artists.errors,
                ...job.details.news.errors,
                ...job.details.filmography.errors,
                ...job.details.trending.errors,
            ];

            if (allErrors.length > 0) {
                const errorText = allErrors.slice(0, 3).map(e => `• ${e}`).join('\n');
                const moreErrors = allErrors.length > 3 ? `\n_... e mais ${allErrors.length - 3} erros_` : '';
                blocks.push({
                    type: 'section',
                    text: {
                        type: 'mrkdwn',
                        text: `*Erros:*\n${errorText}${moreErrors}`,
                    },
                });
            }
        }

        // Context
        blocks.push({ type: 'divider' });
        const contextBlock = this.buildContextBlock({
            source: 'cron',
            timestamp: new Date(),
        });
        if (contextBlock) {
            blocks.push(contextBlock);
        }

        return this.sendMessage(webhook, { blocks });
    }

    /**
     * Notify deploy status
     */
    async notifyDeploy(deploy: DeployNotification): Promise<boolean> {
        if (!this.webhookDeploys) return false;

        const emoji = this.getDeployEmoji(deploy.status);
        const statusLabel = this.getDeployStatusLabel(deploy.status);
        const envLabel = deploy.environment === 'production' ? 'PRODUCAO' : 'STAGING';
        const envEmoji = deploy.environment === 'production' ? '🟢' : '🟡';
        const siteUrl = deploy.environment === 'production'
            ? this.siteUrl
            : this.siteUrl.replace('www.', 'staging.');

        const blocks: SlackBlock[] = [
            {
                type: 'header',
                text: {
                    type: 'plain_text',
                    text: `${emoji} Deploy ${envLabel} - ${statusLabel}`,
                    emoji: true,
                },
            },
            {
                type: 'section',
                fields: [
                    { type: 'mrkdwn', text: `*Ambiente:*\n${envEmoji} ${envLabel}` },
                    { type: 'mrkdwn', text: `*Status:*\n${statusLabel}` },
                ],
            },
        ];

        // Git info with commit message
        if (deploy.branch || deploy.commit) {
            const gitFields = [];
            if (deploy.branch) {
                gitFields.push({ type: 'mrkdwn', text: `*Branch:*\n\`${deploy.branch}\`` });
            }
            if (deploy.commit) {
                const shortCommit = deploy.commit.substring(0, 7);
                gitFields.push({ type: 'mrkdwn', text: `*Commit:*\n\`${shortCommit}\`` });
            }
            if (deploy.duration) {
                gitFields.push({ type: 'mrkdwn', text: `*Duração:*\n${deploy.duration}` });
            }
            blocks.push({ type: 'section', fields: gitFields });
        }

        // Commit message (if provided)
        if (deploy.commitMessage) {
            blocks.push({
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: `*Mensagem:*\n> ${deploy.commitMessage.split('\n')[0]}`
                }
            });
        }

        // Error section
        if (deploy.error) {
            blocks.push({
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: `*Erro:*\n\`\`\`${deploy.error.substring(0, 500)}\`\`\``,
                },
            });
        }

        // Add divider before links
        blocks.push({ type: 'divider' });

        // Build links
        const links: Array<{ label: string; url: string }> = [];

        // Site link (only for successful deploys)
        if (deploy.status === 'success') {
            links.push({ label: '🌐 Ver Site', url: siteUrl });
        }

        // GitHub commit link
        if (deploy.commit) {
            const commitUrl = `https://github.com/${this.githubRepo}/commit/${deploy.commit}`;
            links.push({ label: '📝 Ver Commit', url: commitUrl });
        }

        // Workflow run link
        if (deploy.workflowUrl) {
            links.push({ label: '⚙️ Ver Workflow', url: deploy.workflowUrl });
        }

        // Repository link
        if (deploy.repoUrl) {
            links.push({ label: '📦 Repositório', url: deploy.repoUrl });
        }

        const linksBlock = this.buildLinksBlock(links);
        if (linksBlock) {
            blocks.push(linksBlock);
        }

        // Context block
        const contextBlock = this.buildContextBlock(deploy.context);
        if (contextBlock) {
            blocks.push(contextBlock);
        }

        return this.sendMessage(this.webhookDeploys, { blocks });
    }

    /**
     * Notify backup status
     */
    async notifyBackup(backup: BackupNotification): Promise<boolean> {
        if (!this.webhookAlerts) return false;

        const emoji = backup.status === 'success' ? '💾' : '❌';
        const statusLabel = backup.status === 'success' ? 'Concluído' : 'Falhou';
        const envLabel = backup.environment === 'production' ? 'PRODUÇÃO' : 'STAGING';

        const blocks: SlackBlock[] = [
            {
                type: 'header',
                text: {
                    type: 'plain_text',
                    text: `${emoji} Backup ${envLabel} - ${statusLabel}`,
                    emoji: true,
                },
            },
            {
                type: 'section',
                fields: [
                    { type: 'mrkdwn', text: `*Ambiente:*\n${envLabel}` },
                    { type: 'mrkdwn', text: `*Status:*\n${statusLabel}` },
                ],
            },
        ];

        if (backup.size || backup.retainedCount !== undefined) {
            const detailFields = [];
            if (backup.size) {
                detailFields.push({ type: 'mrkdwn', text: `*Tamanho:*\n${backup.size}` });
            }
            if (backup.retainedCount !== undefined) {
                detailFields.push({ type: 'mrkdwn', text: `*Backups Retidos:*\n${backup.retainedCount}` });
            }
            blocks.push({ type: 'section', fields: detailFields });
        }

        if (backup.error) {
            blocks.push({
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: `*Erro:*\n\`\`\`${backup.error.substring(0, 500)}\`\`\``,
                },
            });
        }

        // Add divider before context
        blocks.push({ type: 'divider' });

        // Context block
        const contextBlock = this.buildContextBlock(backup.context);
        if (contextBlock) {
            blocks.push(contextBlock);
        }

        return this.sendMessage(this.webhookAlerts, { blocks });
    }

    /**
     * Notify health alert
     */
    async notifyHealthAlert(alert: HealthAlertNotification): Promise<boolean> {
        if (!this.webhookAlerts) return false;

        const emoji = alert.status === 'up' ? '✅' : alert.status === 'degraded' ? '⚠️' : '🔴';
        const statusLabel = alert.status === 'up' ? 'Online' : alert.status === 'degraded' ? 'Degradado' : 'Offline';

        const blocks: SlackBlock[] = [
            {
                type: 'header',
                text: {
                    type: 'plain_text',
                    text: `${emoji} Alerta de Saúde - ${alert.service}`,
                    emoji: true,
                },
            },
            {
                type: 'section',
                fields: [
                    { type: 'mrkdwn', text: `*Serviço:*\n${alert.service}` },
                    { type: 'mrkdwn', text: `*Status:*\n${statusLabel}` },
                ],
            },
        ];

        if (alert.message) {
            blocks.push({
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: alert.message,
                },
            });
        }

        // Add divider before context
        blocks.push({ type: 'divider' });

        // Context block
        const contextBlock = this.buildContextBlock(alert.context);
        if (contextBlock) {
            blocks.push(contextBlock);
        }

        return this.sendMessage(this.webhookAlerts, { blocks });
    }

    /**
     * Send generic alert with optional context
     */
    async notifyAlert(
        severity: AlertSeverity,
        title: string,
        message: string,
        context?: ActionContext
    ): Promise<boolean> {
        if (!this.webhookAlerts) return false;

        const emoji = severity === 'error' ? '🚨' : severity === 'warning' ? '⚠️' : 'ℹ️';

        const blocks: SlackBlock[] = [
            {
                type: 'header',
                text: {
                    type: 'plain_text',
                    text: `${emoji} ${title}`,
                    emoji: true,
                },
            },
            {
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: message,
                },
            },
        ];

        // Add divider before context if provided
        if (context) {
            blocks.push({ type: 'divider' });
            const contextBlock = this.buildContextBlock(context);
            if (contextBlock) {
                blocks.push(contextBlock);
            }
        }

        return this.sendMessage(this.webhookAlerts, { blocks });
    }

    /**
     * Notify when a new user registers
     */
    async notifyNewUserRegistered(email: string, name?: string, totalUsers?: number): Promise<boolean> {
        const webhook = this.webhookContent || this.webhookAlerts;
        if (!webhook) return false;

        const blocks: SlackBlock[] = [
            {
                type: 'header',
                text: { type: 'plain_text', text: '👤 Novo Usuário Cadastrado', emoji: true },
            },
            {
                type: 'section',
                fields: [
                    { type: 'mrkdwn', text: `*Nome:*\n${name || 'Não informado'}` },
                    { type: 'mrkdwn', text: `*Email:*\n${email}` },
                ],
            },
        ];

        if (totalUsers !== undefined) {
            blocks.push({
                type: 'section',
                text: { type: 'mrkdwn', text: `*Total de usuários:* ${totalUsers}` },
            });
        }

        blocks.push({ type: 'divider' });
        const contextBlock = this.buildContextBlock({ source: 'api', timestamp: new Date() });
        if (contextBlock) blocks.push(contextBlock);

        return this.sendMessage(webhook, { blocks });
    }

    /**
     * Send raw message to a webhook
     */
    private async sendMessage(webhookUrl: string, payload: { blocks: SlackBlock[]; text?: string }): Promise<boolean> {
        try {
            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...payload,
                    text: payload.text || 'HallyuHub Notification',
                }),
            });

            if (!response.ok) {
                console.error(`[SlackNotificationService] Failed to send message: ${response.status}`);
                return false;
            }

            return true;
        } catch (error) {
            console.error('[SlackNotificationService] Error sending message:', error);
            return false;
        }
    }

    private getContentEmoji(type: ContentType): string {
        const emojis: Record<ContentType, string> = {
            artist: '🎤',
            news: '📰',
            production: '🎬',
            agency: '🏢',
            filmography: '🎞️'
        };
        return emojis[type] || '📝';
    }

    private getContentTypeLabel(type: ContentType): string {
        const labels: Record<ContentType, string> = {
            artist: 'Artista',
            news: 'Notícia',
            production: 'Produção',
            agency: 'Agência',
            filmography: 'Filmografia'
        };
        return labels[type] || type;
    }

    private getDeployEmoji(status: DeployStatus): string {
        const emojis: Record<DeployStatus, string> = {
            started: '🚀',
            success: '✅',
            failed: '❌',
        };
        return emojis[status];
    }

    private getDeployStatusLabel(status: DeployStatus): string {
        const labels: Record<DeployStatus, string> = {
            started: 'Iniciado',
            success: 'Sucesso',
            failed: 'Falhou',
        };
        return labels[status];
    }

    /**
     * Format timestamp to relative + absolute time
     */
    private formatTimestamp(date?: Date): string {
        const timestamp = date || new Date();
        const now = new Date();
        const diffMs = now.getTime() - timestamp.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);

        let relative = '';
        if (diffMins < 1) {
            relative = 'agora';
        } else if (diffMins === 1) {
            relative = 'há 1 minuto';
        } else if (diffMins < 60) {
            relative = `há ${diffMins} minutos`;
        } else if (diffHours === 1) {
            relative = 'há 1 hora';
        } else if (diffHours < 24) {
            relative = `há ${diffHours} horas`;
        } else {
            const diffDays = Math.floor(diffHours / 24);
            relative = diffDays === 1 ? 'há 1 dia' : `há ${diffDays} dias`;
        }

        // Format absolute time: "14:35 · 04/02/2026"
        const hours = timestamp.getHours().toString().padStart(2, '0');
        const mins = timestamp.getMinutes().toString().padStart(2, '0');
        const day = timestamp.getDate().toString().padStart(2, '0');
        const month = (timestamp.getMonth() + 1).toString().padStart(2, '0');
        const year = timestamp.getFullYear();
        const absolute = `${hours}:${mins} · ${day}/${month}/${year}`;

        return `${relative} (${absolute})`;
    }

    /**
     * Build context block with user info, timestamp, and source
     */
    private buildContextBlock(context?: ActionContext): SlackBlock | null {
        if (!context) return null;

        const elements: Array<{ type: string; text: string }> = [];

        // Timestamp
        const timestamp = this.formatTimestamp(context.timestamp);
        elements.push({ type: 'mrkdwn', text: `🕐 ${timestamp}` });

        // User info
        if (context.user) {
            const userName = context.user.name || context.user.email || 'Usuário';
            const userRole = context.user.role ? ` (${context.user.role})` : '';
            elements.push({ type: 'mrkdwn', text: `👤 ${userName}${userRole}` });
        }

        // Source
        const sourceEmoji = this.getSourceEmoji(context.source);
        const sourceLabel = this.getSourceLabel(context.source);
        elements.push({ type: 'mrkdwn', text: `${sourceEmoji} ${sourceLabel}` });

        // Triggered by (if different from source)
        if (context.triggeredBy) {
            elements.push({ type: 'mrkdwn', text: `⚡ ${context.triggeredBy}` });
        }

        return {
            type: 'context',
            elements
        };
    }

    /**
     * Build links block for quick access
     */
    private buildLinksBlock(links: Array<{ label: string; url: string }>): SlackBlock | null {
        if (links.length === 0) return null;

        const linkTexts = links.map(link => `<${link.url}|${link.label}>`).join(' · ');

        return {
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: `🔗 ${linkTexts}`
            }
        };
    }

    private getSourceEmoji(source: ActionSource): string {
        const emojis: Record<ActionSource, string> = {
            admin: '⚙️',
            cron: '⏰',
            api: '🔌',
            manual: '✋',
            system: '🤖'
        };
        return emojis[source] || '📌';
    }

    private getSourceLabel(source: ActionSource): string {
        const labels: Record<ActionSource, string> = {
            admin: 'Admin Panel',
            cron: 'Cron Job',
            api: 'API',
            manual: 'Manual',
            system: 'Sistema'
        };
        return labels[source] || source;
    }
}

// Singleton instance for easy import
let slackServiceInstance: SlackNotificationService | null = null;

export function getSlackService(): SlackNotificationService {
    if (!slackServiceInstance) {
        slackServiceInstance = new SlackNotificationService();
    }
    return slackServiceInstance;
}
