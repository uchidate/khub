import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

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
      stats,
      recentNews,
      logs,
      timestamp: new Date().toISOString(),
      note: 'Estatísticas baseadas em dados do banco. Para logs detalhados do servidor, consulte via SSH.',
    });

  } catch (error: any) {
    console.error('[Admin Cron API] Error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
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
