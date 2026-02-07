#!/usr/bin/env node
/**
 * Monitor de Notícias via API Pública
 *
 * Monitora o crescimento de notícias através do endpoint /api/metrics
 * Útil para verificar se o cron está funcionando corretamente
 *
 * Uso:
 *   node scripts/monitor-news.js
 *   node scripts/monitor-news.js --interval 60  (verificar a cada 60s)
 */

const PROD_URL = 'https://hallyuhub.com';
const DEFAULT_INTERVAL = 30; // segundos

// Parse argumentos
const args = process.argv.slice(2);
const intervalIndex = args.indexOf('--interval');
const interval = intervalIndex >= 0 && args[intervalIndex + 1]
    ? parseInt(args[intervalIndex + 1])
    : DEFAULT_INTERVAL;

let previousData = null;
let monitoringStart = new Date();

/**
 * Busca métricas do endpoint público
 */
async function fetchMetrics() {
    try {
        const response = await fetch(`${PROD_URL}/api/metrics`);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const text = await response.text();

        // Parse Prometheus format
        const metrics = {};
        const lines = text.split('\n');

        for (const line of lines) {
            if (line.startsWith('#') || !line.trim()) continue;

            // hallyuhub_entities_total{type="news"} 192
            const match = line.match(/hallyuhub_entities_total\{type="(\w+)"\}\s+(\d+)/);
            if (match) {
                metrics[match[1]] = parseInt(match[2]);
            }

            // hallyuhub_uptime_seconds 12345.67
            const uptimeMatch = line.match(/hallyuhub_uptime_seconds\s+([\d.]+)/);
            if (uptimeMatch) {
                metrics.uptime = parseFloat(uptimeMatch[1]);
            }
        }

        return metrics;
    } catch (error) {
        console.error(`❌ Erro ao buscar métricas: ${error.message}`);
        return null;
    }
}

/**
 * Formata segundos para duração legível
 */
function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
        return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
        return `${minutes}m ${secs}s`;
    } else {
        return `${secs}s`;
    }
}

/**
 * Calcula taxa de crescimento
 */
function calculateGrowthRate(current, previous, timeDiff) {
    const diff = current - previous;
    const perHour = (diff / timeDiff) * 3600;
    const perDay = perHour * 24;

    return { diff, perHour: perHour.toFixed(1), perDay: perDay.toFixed(0) };
}

/**
 * Exibe métricas atuais
 */
function displayMetrics(metrics, iteration) {
    const now = new Date();
    const timestamp = now.toLocaleTimeString('pt-BR');

    console.log('\n' + '='.repeat(80));
    console.log(`📊 Métricas - ${timestamp} (Iteração #${iteration})`);
    console.log('='.repeat(80));

    // Contadores atuais
    console.log('\n📈 Contadores Atuais:');
    console.log(`   📰 Notícias:    ${metrics.news || 0}`);
    console.log(`   🎤 Artistas:    ${metrics.artist || 0}`);
    console.log(`   🎬 Produções:   ${metrics.production || 0}`);
    console.log(`   🏢 Agências:    ${metrics.agency || 0}`);

    // Uptime
    if (metrics.uptime) {
        console.log(`\n⏱️  Uptime do App: ${formatDuration(metrics.uptime)}`);
    }

    // Crescimento (se houver dados anteriores)
    if (previousData && previousData.metrics.news) {
        const timeDiff = (now - previousData.timestamp) / 1000; // segundos

        console.log('\n📊 Crescimento desde última checagem:');

        const newsGrowth = calculateGrowthRate(
            metrics.news,
            previousData.metrics.news,
            timeDiff
        );

        console.log(`   📰 Notícias: +${newsGrowth.diff} (${newsGrowth.perHour}/hora, ~${newsGrowth.perDay}/dia)`);

        const artistGrowth = calculateGrowthRate(
            metrics.artist || 0,
            previousData.metrics.artist || 0,
            timeDiff
        );

        if (artistGrowth.diff > 0) {
            console.log(`   🎤 Artistas: +${artistGrowth.diff} (${artistGrowth.perHour}/hora, ~${artistGrowth.perDay}/dia)`);
        }

        // Status do cron
        const expectedNewsPerCheck = 5;
        const checksIn15Min = Math.ceil(timeDiff / 900); // 900s = 15min
        const expectedNews = expectedNewsPerCheck * checksIn15Min;

        console.log('\n🎯 Análise (baseado em 5 notícias/15min):');
        console.log(`   Esperado: ~${expectedNews} notícias em ${formatDuration(timeDiff)}`);
        console.log(`   Obtido:   ${newsGrowth.diff} notícias`);

        if (newsGrowth.diff >= expectedNews * 0.8) {
            console.log(`   ✅ Status: ÓTIMO (${((newsGrowth.diff / expectedNews) * 100).toFixed(0)}%)`);
        } else if (newsGrowth.diff >= expectedNews * 0.5) {
            console.log(`   ⚠️  Status: MODERADO (${((newsGrowth.diff / expectedNews) * 100).toFixed(0)}%)`);
        } else if (newsGrowth.diff > 0) {
            console.log(`   ⚠️  Status: BAIXO (${((newsGrowth.diff / expectedNews) * 100).toFixed(0)}%)`);
        } else {
            console.log(`   ❌ Status: SEM CRESCIMENTO`);
        }
    }

    // Tempo de monitoramento
    const monitorDuration = (now - monitoringStart) / 1000;
    console.log(`\n⏲️  Monitorando há: ${formatDuration(monitorDuration)}`);
    console.log(`   Próxima checagem em: ${interval}s`);

    // Salvar dados atuais
    previousData = {
        metrics,
        timestamp: now
    };
}

/**
 * Loop principal
 */
async function monitor() {
    let iteration = 1;

    console.log('🚀 Iniciando monitoramento de notícias...');
    console.log(`📍 Endpoint: ${PROD_URL}/api/metrics`);
    console.log(`⏱️  Intervalo: ${interval}s`);
    console.log('\nPressione Ctrl+C para parar\n');

    // Primeira checagem imediata
    const metrics = await fetchMetrics();
    if (metrics) {
        displayMetrics(metrics, iteration);
    }

    // Loop de monitoramento
    setInterval(async () => {
        iteration++;
        const metrics = await fetchMetrics();
        if (metrics) {
            displayMetrics(metrics, iteration);
        }
    }, interval * 1000);
}

// Iniciar monitoramento
monitor().catch(console.error);

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n\n👋 Encerrando monitoramento...');

    if (previousData) {
        const totalDuration = (new Date() - monitoringStart) / 1000;
        console.log(`\n📊 Resumo da Sessão (${formatDuration(totalDuration)}):`);
        console.log(`   Total de notícias no final: ${previousData.metrics.news || 0}`);
    }

    process.exit(0);
});
