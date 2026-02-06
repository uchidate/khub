import { getSlackService } from '../lib/services/slack-notification-service';

async function monitorHealth() {
    console.log('🔍 Running HallyuHub System Health Monitor...');

    const slackService = getSlackService();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const healthUrl = `${siteUrl}/api/health`;

    try {
        const response = await fetch(healthUrl, {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
        });

        if (!response.ok) {
            throw new Error(`Health endpoint returned ${response.status}`);
        }

        const health = await response.json();
        const issues: string[] = [];

        // 1. Check global status
        if (!health.ok) {
            issues.push('🔴 Global health check failed (`ok: false`)');
        }

        // 2. Check AI Providers
        if (health.ai && health.ai.providers) {
            const { gemini, ollama } = health.ai.providers;

            if (!gemini.configured) {
                issues.push('⚠️ Gemini API Key not configured');
            }

            if (!ollama.configured) {
                issues.push('⚠️ Ollama Base URL not configured');
            } else if (!ollama.available) {
                issues.push('🔴 Ollama service is unreachable');
            }
        }

        // 3. Check Monitoring (Slack)
        if (health.monitoring && health.monitoring.slack) {
            const { content, alerts } = health.monitoring.slack;

            if (!content) {
                issues.push('⚠️ Slack Content Webhook is missing');
            }

            if (!alerts) {
                issues.push('⚠️ Slack Alerts Webhook is missing');
            }
        }

        // 4. Check External Data Providers (TMDB)
        if (health.monitoring && health.monitoring.tmdb) {
            const { configured, available } = health.monitoring.tmdb;
            if (!configured) {
                issues.push('⚠️ TMDB API Key not configured');
            } else if (!available) {
                issues.push('🔴 TMDB API is unreachable/invalid');
            }
        }

        // Final Action
        if (issues.length > 0) {
            console.error(`❌ System Health Issues Detected: ${issues.length}`);
            issues.forEach(issue => console.error(`   - ${issue}`));

            if (slackService.isEnabled()) {
                await slackService.notifyHealthAlert({
                    service: 'System Health Monitor',
                    status: 'degraded',
                    message: `*Problemas detectados:*\n${issues.map(i => `• ${i}`).join('\n')}`,
                    context: {
                        source: 'cron',
                        timestamp: new Date(),
                        triggeredBy: 'Periodic Health Check (30m)'
                    }
                });
                console.log('✅ Slack alert sent');
            }
        } else {
            console.log('✅ System Health: PERFECT');
        }

    } catch (error: any) {
        console.error(`❌ Critical Error during health monitor: ${error.message}`);

        if (slackService.isEnabled()) {
            await slackService.notifyHealthAlert({
                service: 'System Health Monitor',
                status: 'down',
                message: `Não foi possível acessar o health endpoint: \`${error.message}\``,
                context: {
                    source: 'cron',
                    timestamp: new Date(),
                    triggeredBy: 'Periodic Health Check (30m)'
                }
            });
        }
    }
}

monitorHealth()
    .catch(err => {
        console.error('Fatal crash in health monitor:', err);
        process.exit(1);
    });
