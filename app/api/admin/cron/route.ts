import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

/**
 * Admin endpoint para visualizar informações de cron jobs
 * GET /api/admin/cron
 *
 * Retorna:
 * - Logs de execução recentes
 * - Estatísticas de sucesso/falha
 * - Próxima execução agendada
 * - Status dos containers Ollama
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

    // Buscar logs de cron (últimas 100 linhas)
    let cronLogs: string[] = [];
    const logPath = isProduction
      ? '/var/www/hallyuhub/logs/cron-direct.log'
      : '/var/www/hallyuhub/logs/staging-cron-2026-02.log';

    try {
      if (fs.existsSync(logPath)) {
        const logContent = execSync(`tail -100 ${logPath}`, { encoding: 'utf-8' });
        cronLogs = logContent.split('\n').filter(line => line.trim());
      }
    } catch (error) {
      console.error('Error reading cron logs:', error);
    }

    // Buscar informações da crontab
    let cronSchedule = '';
    try {
      cronSchedule = execSync('crontab -l 2>/dev/null | grep -E "(auto-generate|staging-cron)" || echo "No cron configured"', {
        encoding: 'utf-8'
      }).trim();
    } catch (error) {
      cronSchedule = 'Error reading crontab';
    }

    // Buscar último resultado da API de cron
    let lastCronResult = null;
    try {
      if (fs.existsSync('/tmp/cron-response.json')) {
        const content = fs.readFileSync('/tmp/cron-response.json', 'utf-8');
        lastCronResult = JSON.parse(content);
      }
    } catch (error) {
      console.error('Error reading last cron result:', error);
    }

    // Buscar status do container Ollama
    let ollamaStatus = 'unknown';
    try {
      const containerName = isProduction ? 'hallyuhub-ollama-production' : 'hallyuhub-ollama-staging';
      const result = execSync(`docker ps --filter "name=${containerName}" --format "{{.Status}}"`, {
        encoding: 'utf-8'
      }).trim();
      ollamaStatus = result || 'not running';
    } catch (error) {
      ollamaStatus = 'error checking status';
    }

    // Analisar logs para extrair estatísticas
    const stats = analyzeCronLogs(cronLogs);

    return NextResponse.json({
      environment: env,
      cronSchedule,
      lastCronResult,
      ollamaStatus,
      logs: cronLogs.slice(-50), // Últimas 50 linhas
      stats,
      timestamp: new Date().toISOString(),
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
 * Analisa logs de cron para extrair estatísticas
 */
function analyzeCronLogs(logs: string[]): {
  totalRuns: number;
  successRuns: number;
  failedRuns: number;
  lastRun: string | null;
  averageDuration: number | null;
} {
  let totalRuns = 0;
  let successRuns = 0;
  let failedRuns = 0;
  let lastRun: string | null = null;
  const durations: number[] = [];

  for (const log of logs) {
    // Detectar início de execução
    if (log.includes('Starting scheduled update') || log.includes('Iniciando cron')) {
      totalRuns++;
      const match = log.match(/\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\]/);
      if (match) {
        lastRun = match[1];
      }
    }

    // Detectar sucesso
    if (log.includes('✅ Atualização concluída') || log.includes('Job completed')) {
      successRuns++;
    }

    // Detectar falhas
    if (log.includes('❌ ERRO') || log.includes('ERROR')) {
      failedRuns++;
    }

    // Extrair duração
    const durationMatch = log.match(/completed in (\d+\.?\d*)s/);
    if (durationMatch) {
      durations.push(parseFloat(durationMatch[1]));
    }
  }

  const averageDuration = durations.length > 0
    ? durations.reduce((a, b) => a + b, 0) / durations.length
    : null;

  return {
    totalRuns,
    successRuns,
    failedRuns,
    lastRun,
    averageDuration,
  };
}
