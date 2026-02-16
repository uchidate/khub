import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import fs from 'fs';
import path from 'path';
import { createLogger } from '@/lib/utils/logger';
import { getErrorMessage } from '@/lib/utils/error';

const log = createLogger('ADMIN-CRON');

/**
 * Admin endpoint para visualizar informações de cron jobs
 * GET /api/admin/cron
 *
 * NOTA: Este endpoint roda dentro do container Docker, então não tem acesso
 * direto aos comandos do host (crontab, docker ps, etc).
 *
 * Retorna estatísticas baseadas em:
 * - Dados do banco de dados (notícias, artistas, produções)
 * - Variáveis de ambiente
 * - Informações do sistema disponíveis no container
 */
export async function GET(request: NextRequest) {
  const session = await auth();

  // Verificar autenticação
  if (!session?.user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Verificar role admin
  if (session.user.role?.toLowerCase() !== 'admin') {
    return NextResponse.json(
      { error: 'Forbidden - Admin access required' },
      { status: 403 }
    );
  }

  try {
    const env = process.env.DEPLOY_ENV || 'production';
    const isProduction = env === 'production';

    // Buscar estatísticas do banco de dados
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalNews,
      newsLast24h,
      newsLast7days,
      totalArtists,
      artistsLast24h,
      totalProductions,
      productionsLast24h,
      recentNews,
    ] = await Promise.all([
      prisma.news.count(),
      prisma.news.count({ where: { createdAt: { gte: oneDayAgo } } }),
      prisma.news.count({ where: { createdAt: { gte: oneWeekAgo } } }),
      prisma.artist.count(),
      prisma.artist.count({ where: { createdAt: { gte: oneDayAgo } } }),
      prisma.production.count(),
      prisma.production.count({ where: { createdAt: { gte: oneDayAgo } } }),
      prisma.news.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          createdAt: true,
        },
      }),
    ]);

    // Informações de configuração
    const cronConfig = {
      environment: env,
      ollamaModel: process.env.OLLAMA_MODEL || 'phi3',
      ollamaBaseUrl: process.env.OLLAMA_BASE_URL || 'http://ollama-production:11434',
      newsPerRun: env === 'staging' ? 2 : 5,
      expectedFrequency: '15 minutos',
    };

    // Cron jobs configurados (lê do arquivo gerado durante o deploy)
    const cronJobs = loadCronJobs(env);

    // Estatísticas calculadas
    const stats = {
      totalNews,
      newsLast24h,
      newsLast7days,
      totalArtists,
      artistsLast24h,
      totalProductions,
      productionsLast24h,
      averageNewsPerDay: newsLast7days > 0 ? (newsLast7days / 7).toFixed(1) : '0',
      lastNewsCreated: recentNews.length > 0 ? recentNews[0].createdAt : null,
    };

    // Logs simulados baseados em dados reais
    const logs = generateLogsFromStats(recentNews, env);

    return NextResponse.json({
      config: cronConfig,
      cronJobs,
      stats,
      recentNews,
      logs,
      timestamp: new Date().toISOString(),
      note: 'Estatísticas baseadas em dados do banco. Para logs detalhados do servidor, consulte via SSH.',
    });

  } catch (error: unknown) {
    log.error('Admin Cron API error', { error: getErrorMessage(error) });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Carrega configuração dos cron jobs do arquivo gerado durante o deploy
 * Fallback para valores hardcoded se arquivo não existir
 */
function loadCronJobs(env: string): Array<{name: string; schedule: string; description: string; frequency: string; script: string; nextRun: string}> {
  const configFile = `/var/www/hallyuhub/cron-config-${env}.json`;

  try {
    // Tentar ler do arquivo gerado durante deploy
    if (fs.existsSync(configFile)) {
      const fileContent = fs.readFileSync(configFile, 'utf-8');
      const jobs = JSON.parse(fileContent);

      // Adicionar nextRun para cada job
      return jobs.map((job: any) => ({
        ...job,
        nextRun: getNextCronRun(job.schedule)
      }));
    }
  } catch (error) {
    log.warn(`Could not read ${configFile}, using fallback`);
  }

  // Fallback: valores hardcoded
  const isProduction = env === 'production';
  return isProduction ? [
    {
      name: 'Auto-generate Content',
      schedule: '*/15 * * * *',
      description: 'Gera notícias, artistas e produções automaticamente',
      frequency: 'A cada 15 minutos',
      script: '/var/www/hallyuhub/scripts/cron-direct.sh',
      nextRun: getNextCronRun('*/15 * * * *'),
    },
    {
      name: 'Health Monitor',
      schedule: '*/30 * * * *',
      description: 'Monitora saúde dos containers e serviços',
      frequency: 'A cada 30 minutos',
      script: '/var/www/hallyuhub/scripts/health-monitor.sh',
      nextRun: getNextCronRun('*/30 * * * *'),
    },
    {
      name: 'Server Cleanup',
      schedule: '0 3 * * *',
      description: 'Limpa logs, imagens Docker e cache antigos automaticamente',
      frequency: 'Diariamente às 3h da manhã',
      script: '/var/www/hallyuhub/scripts/cleanup-cron.sh',
      nextRun: getNextCronRun('0 3 * * *'),
    },
  ] : [
    {
      name: 'Staging Content Generation',
      schedule: '*/15 * * * *',
      description: 'Gera 2 notícias para testes (staging)',
      frequency: 'A cada 15 minutos',
      script: '/var/www/hallyuhub/scripts/staging-cron.sh',
      nextRun: getNextCronRun('*/15 * * * *'),
    },
    {
      name: 'Server Cleanup',
      schedule: '0 3 * * *',
      description: 'Limpa logs, imagens Docker e cache antigos automaticamente',
      frequency: 'Diariamente às 3h da manhã',
      script: '/var/www/hallyuhub/scripts/cleanup-cron.sh',
      nextRun: getNextCronRun('0 3 * * *'),
    },
    {
      name: 'Ollama Sleep',
      schedule: '0 0 * * *',
      description: 'Para Ollama à meia-noite para economizar recursos',
      frequency: 'Diariamente à meia-noite',
      script: 'inline (docker-compose stop)',
      nextRun: getNextCronRun('0 0 * * *'),
    },
  ];
}

/**
 * Calcula próxima execução de um cron job
 * Simplificado - apenas para crons comuns (* /N minutos, horários específicos)
 */
function getNextCronRun(schedule: string): string {
  const now = new Date();

  // Parse simples para crons comuns
  if (schedule === '*/15 * * * *') {
    // A cada 15 minutos
    const nextMinute = Math.ceil(now.getMinutes() / 15) * 15;
    const next = new Date(now);
    next.setMinutes(nextMinute, 0, 0);
    if (next <= now) next.setMinutes(next.getMinutes() + 15);
    return next.toLocaleString('pt-BR', { timeZone: 'UTC' }) + ' (UTC)';
  }

  if (schedule === '*/30 * * * *') {
    // A cada 30 minutos
    const nextMinute = Math.ceil(now.getMinutes() / 30) * 30;
    const next = new Date(now);
    next.setMinutes(nextMinute, 0, 0);
    if (next <= now) next.setMinutes(next.getMinutes() + 30);
    return next.toLocaleString('pt-BR', { timeZone: 'UTC' }) + ' (UTC)';
  }

  if (schedule === '0 0 * * *') {
    // Meia-noite UTC
    const next = new Date(now);
    next.setUTCHours(24, 0, 0, 0);
    return next.toLocaleString('pt-BR', { timeZone: 'UTC' }) + ' (UTC)';
  }

  if (schedule === '0 3 * * *') {
    // 3h da manhã UTC
    const next = new Date(now);
    if (now.getUTCHours() >= 3) {
      // Já passou das 3h hoje, agendar para amanhã
      next.setUTCDate(next.getUTCDate() + 1);
    }
    next.setUTCHours(3, 0, 0, 0);
    return next.toLocaleString('pt-BR', { timeZone: 'UTC' }) + ' (UTC)';
  }

  return 'N/A';
}

/**
 * Gera logs informativos baseados em dados reais do banco
 */
function generateLogsFromStats(
  recentNews: Array<{ id: string; title: string; createdAt: Date }>,
  env: string
): string[] {
  const logs: string[] = [];

  logs.push(`=== Cron Jobs - ${env.toUpperCase()} Environment ===`);
  logs.push('');
  logs.push('📊 Últimas notícias criadas:');
  logs.push('');

  if (recentNews.length === 0) {
    logs.push('  ⚠️  Nenhuma notícia criada recentemente');
  } else {
    recentNews.forEach((news, idx) => {
      const date = new Date(news.createdAt).toLocaleString('pt-BR');
      logs.push(`  ${idx + 1}. [${date}] ${news.title.substring(0, 80)}...`);
    });
  }

  logs.push('');
  logs.push('💡 Para ver logs detalhados do cron job:');
  logs.push(`   ssh root@31.97.255.107 "tail -100 /var/www/hallyuhub/logs/${env === 'production' ? 'cron-direct' : 'staging-cron-2026-02'}.log"`);
  logs.push('');
  logs.push('📌 Este painel mostra estatísticas do banco de dados.');
  logs.push('   Logs completos estão disponíveis via SSH no servidor.');

  return logs;
}
