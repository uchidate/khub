/**
 * Slack Notification Service
 * Centralized service for sending notifications to Slack channels
 *
 * Channels:
 * - #hallyuhub-content: New artists, news, films, series
 * - #hallyuhub-deploys: Deploy status (staging/production)
 * - #hallyuhub-alerts: Backups, health alerts, errors
 */

export type ContentType = 'artist' | 'news' | 'production' | 'agency';
export type DeployEnvironment = 'staging' | 'production';
export type DeployStatus = 'started' | 'success' | 'failed';
export type BackupStatus = 'success' | 'failed';
export type AlertSeverity = 'info' | 'warning' | 'error';

interface ContentNotification {
    type: ContentType;
    name: string;
    details?: Record<string, string | number | null>;
    source?: string;
    url?: string;
}

interface DeployNotification {
    environment: DeployEnvironment;
    status: DeployStatus;
    branch?: string;
    commit?: string;
    duration?: string;
    error?: string;
}

interface BackupNotification {
    environment: DeployEnvironment;
    status: BackupStatus;
    size?: string;
    retainedCount?: number;
    error?: string;
}

interface HealthAlertNotification {
    service: string;
    status: 'up' | 'down' | 'degraded';
    message?: string;
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

    constructor() {
        this.webhookContent = process.env.SLACK_WEBHOOK_CONTENT || null;
        this.webhookDeploys = process.env.SLACK_WEBHOOK_DEPLOYS || null;
        this.webhookAlerts = process.env.SLACK_WEBHOOK_ALERTS || null;
        this.siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

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
     * Notify when new content is added (artists, news, productions)
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

        // Add source info
        if (content.source) {
            blocks.push({
                type: 'context',
                elements: [
                    { type: 'mrkdwn', text: `Fonte: ${content.source}` },
                ],
            });
        }

        // Add link to site
        if (content.url) {
            blocks.push({
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: `<${content.url}|Ver no site>`,
                },
            });
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
        provider: string;
        duration?: string;
    }): Promise<boolean> {
        if (!this.webhookContent) return false;

        const total = summary.artists + summary.news + summary.productions;
        if (total === 0) return false;

        const blocks: SlackBlock[] = [
            {
                type: 'header',
                text: {
                    type: 'plain_text',
                    text: '📊 Resumo de Conteudo Gerado',
                    emoji: true,
                },
            },
            {
                type: 'section',
                fields: [
                    { type: 'mrkdwn', text: `*Artistas:*\n${summary.artists}` },
                    { type: 'mrkdwn', text: `*Noticias:*\n${summary.news}` },
                    { type: 'mrkdwn', text: `*Producoes:*\n${summary.productions}` },
                    { type: 'mrkdwn', text: `*Provider:*\n${summary.provider}` },
                ],
            },
        ];

        if (summary.duration) {
            blocks.push({
                type: 'context',
                elements: [
                    { type: 'mrkdwn', text: `Duracao: ${summary.duration}` },
                ],
            });
        }

        return this.sendMessage(this.webhookContent, { blocks });
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

        if (deploy.branch || deploy.commit) {
            const gitFields = [];
            if (deploy.branch) {
                gitFields.push({ type: 'mrkdwn', text: `*Branch:*\n${deploy.branch}` });
            }
            if (deploy.commit) {
                gitFields.push({ type: 'mrkdwn', text: `*Commit:*\n\`${deploy.commit.substring(0, 7)}\`` });
            }
            blocks.push({ type: 'section', fields: gitFields });
        }

        if (deploy.duration) {
            blocks.push({
                type: 'context',
                elements: [
                    { type: 'mrkdwn', text: `Duracao: ${deploy.duration}` },
                ],
            });
        }

        if (deploy.error) {
            blocks.push({
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: `*Erro:*\n\`\`\`${deploy.error}\`\`\``,
                },
            });
        }

        return this.sendMessage(this.webhookDeploys, { blocks });
    }

    /**
     * Notify backup status
     */
    async notifyBackup(backup: BackupNotification): Promise<boolean> {
        if (!this.webhookAlerts) return false;

        const emoji = backup.status === 'success' ? '💾' : '❌';
        const statusLabel = backup.status === 'success' ? 'Concluido' : 'Falhou';
        const envLabel = backup.environment === 'production' ? 'PRODUCAO' : 'STAGING';

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
                    text: `*Erro:*\n\`\`\`${backup.error}\`\`\``,
                },
            });
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
                    text: `${emoji} Alerta de Saude - ${alert.service}`,
                    emoji: true,
                },
            },
            {
                type: 'section',
                fields: [
                    { type: 'mrkdwn', text: `*Servico:*\n${alert.service}` },
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

        return this.sendMessage(this.webhookAlerts, { blocks });
    }

    /**
     * Send generic alert
     */
    async notifyAlert(severity: AlertSeverity, title: string, message: string): Promise<boolean> {
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

        return this.sendMessage(this.webhookAlerts, { blocks });
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
        };
        return emojis[type] || '📝';
    }

    private getContentTypeLabel(type: ContentType): string {
        const labels: Record<ContentType, string> = {
            artist: 'Artista',
            news: 'Noticia',
            production: 'Producao',
            agency: 'Agencia',
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
}

// Singleton instance for easy import
let slackServiceInstance: SlackNotificationService | null = null;

export function getSlackService(): SlackNotificationService {
    if (!slackServiceInstance) {
        slackServiceInstance = new SlackNotificationService();
    }
    return slackServiceInstance;
}
