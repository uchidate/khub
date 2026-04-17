import { getSlackService } from '../lib/services/slack-notification-service';

async function monitorHealth() {
    console.log('🔍 Running HallyuHub System Health Monitor...');

    const slackService = getSlackService();
    // Use localhost to bypass nginx — matches what monitor-health.sh does
    const healthUrl = 'http://localhost:3000/api/health';

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10_000);

        let response: Response;
        try {
            response = await fetch(healthUrl, {
                method: 'GET',
                headers: { 'Accept': 'application/json' },
                signal: controller.signal,
            });
        } finally {
            clearTimeout(timeout);
        }

        if (!response.ok) {
            throw new Error(`Health endpoint returned ${response.status}`);
        }

        const health = await response.json();
        const issues: string[] = [];

        // 1. Check global status
        if (!health.ok) {
            issues.push('🔴 Global health check failed (`ok: false`)');
        }

        // 2. Check database latency (only field exposed by /api/health)
        if (health.db) {
            if (!health.db.ok) {
                issues.push('🔴 Database connection failed');
            } else if (health.db.latencyMs !== null && health.db.latencyMs > 2000) {
                issues.push(`⚠️ High DB latency: ${health.db.latencyMs}ms`);
            }
        }

        // Final Action
        if (issues.length > 0) {
            console.error(`❌ System Health Issues Detected: ${issues.length}`);
            issues.forEach(issue => console.error(`   - ${issue}`));

            if (slackService.isEnabled()) {
                await slackService.notifyHealthAlert({
                    service: 'System Health Monitor',
                    status: health.db?.ok === false ? 'down' : 'degraded',
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
        const msg = error.name === 'AbortError' ? 'Health endpoint timed out (>10s)' : error.message;
        console.error(`❌ Critical Error during health monitor: ${msg}`);

        if (slackService.isEnabled()) {
            await slackService.notifyHealthAlert({
                service: 'System Health Monitor',
                status: 'down',
                message: `Não foi possível acessar o health endpoint: \`${msg}\``,
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
