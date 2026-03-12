import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import { getOrchestrator, getOrchestratorStats } from '@/lib/ai/orchestrator-factory'
import { createLogger } from '@/lib/utils/logger'
import { getErrorMessage } from '@/lib/utils/error'

const log = createLogger('ADMIN-AI')

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/ai/status
 * Diagnóstico em tempo real de todos os providers de IA.
 * Verifica disponibilidade, circuit breakers e faz teste de latência.
 */
export async function GET() {
    const { error } = await requireAdmin()
    if (error) return error

    const startTime = Date.now()

    // Testar cada provider configurado
    const testPrompt = 'Responda com exatamente: {"ok": true}'
    const testSchema = '{"ok": "boolean"}'

    interface ProviderStatus {
        name: string
        configured: boolean
        circuitOpen: boolean
        circuitCooldownRemaining: number
        consecutiveFailures: number
        stats: { requests: number; failures: number; cost: number }
        test?: {
            success: boolean
            latencyMs: number
            error?: string
            model?: string
        }
    }

    const providerStatuses: Record<string, ProviderStatus> = {}

    // Obter estatísticas do orchestrator atual
    const orchStats = getOrchestratorStats()

    // Status de cada provider pelo config
    const providerNames = ['deepseek', 'ollama', 'openai', 'claude', 'gemini'] as const

    for (const name of providerNames) {
        const stats = orchStats?.providerStats[name]

        providerStatuses[name] = {
            name,
            configured: false,
            circuitOpen: false,
            circuitCooldownRemaining: 0,
            consecutiveFailures: (stats as any)?.consecutiveFailures ?? 0,
            stats: {
                requests: stats?.requests ?? 0,
                failures: stats?.failures ?? 0,
                cost: stats?.cost ?? 0,
            },
        }

        // Verificar se está configurado baseado nas env vars
        switch (name) {
            case 'deepseek':
                providerStatuses[name].configured = !!process.env.DEEPSEEK_API_KEY
                break
            case 'ollama':
                providerStatuses[name].configured = !!process.env.OLLAMA_BASE_URL
                break
            case 'openai':
                providerStatuses[name].configured = !!process.env.OPENAI_API_KEY
                break
            case 'claude':
                providerStatuses[name].configured = !!process.env.ANTHROPIC_API_KEY
                break
            case 'gemini':
                providerStatuses[name].configured = !!process.env.GEMINI_API_KEY
                break
        }

        if (stats) {
            providerStatuses[name].circuitOpen = (stats as any).circuitOpen ?? false
            providerStatuses[name].circuitCooldownRemaining = (stats as any).circuitCooldownRemaining ?? 0
        }
    }

    // Teste rápido de latência: testar o provider ativo
    let testResult: { provider: string; latencyMs: number; success: boolean; error?: string } | null = null

    try {
        const orchestrator = getOrchestrator()
        const testStart = Date.now()

        const result = await orchestrator.generateStructured<{ ok: boolean }>(
            testPrompt,
            testSchema,
            { maxTokens: 20 }
        )

        testResult = {
            provider: 'auto',
            latencyMs: Date.now() - testStart,
            success: result.ok === true,
        }
    } catch (err: unknown) {
        log.error('AI provider test failed', { error: getErrorMessage(err) })
        testResult = {
            provider: 'none',
            latencyMs: Date.now() - startTime,
            success: false,
            error: getErrorMessage(err),
        }
    }

    // Informações do ambiente
    const envInfo = {
        OLLAMA_BASE_URL: process.env.OLLAMA_BASE_URL ? '✅ configurado' : '❌ não configurado',
        OLLAMA_MODEL: process.env.OLLAMA_MODEL || 'phi3 (padrão)',
        OPENAI_API_KEY: process.env.OPENAI_API_KEY ? '✅ configurado' : '❌ não configurado',
        ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ? '✅ configurado' : '❌ não configurado',
        GEMINI_API_KEY: process.env.GEMINI_API_KEY ? '✅ configurado (mas desabilitado no código)' : '❌ não configurado',
        DEPLOY_ENV: process.env.DEPLOY_ENV || 'não definido',
    }

    const totalDurationMs = Date.now() - startTime

    return NextResponse.json({
        status: testResult?.success ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        totalDurationMs,
        providers: Object.values(providerStatuses),   // array, não objeto
        testedProvider: testResult?.provider,
        testLatencyMs: testResult?.latencyMs,
        quickTest: testResult,
        env: envInfo,
        orchestratorStats: orchStats,
        recommendations: generateRecommendations(providerStatuses, testResult),
    })
}

function generateRecommendations(
    providers: Record<string, { configured: boolean; circuitOpen: boolean; consecutiveFailures: number }>,
    test: { success: boolean; latencyMs: number; error?: string } | null
): string[] {
    const recs: string[] = []

    if (providers.ollama?.configured && providers.ollama?.consecutiveFailures >= 3) {
        recs.push('⚠️ Ollama com muitas falhas consecutivas — circuit breaker ativo. Verifique se o modelo está carregado: docker exec ollama ollama list')
    }

    if (providers.ollama?.configured && !providers.ollama?.circuitOpen) {
        recs.push('💡 Ollama configurado. Para modelos mais rápidos no servidor: OLLAMA_MODEL=tinyllama (rápido) ou OLLAMA_MODEL=phi3 (qualidade)')
    }

    if (!providers.openai?.configured && !providers.claude?.configured && !providers.gemini?.configured) {
        recs.push('🚨 Nenhum provider cloud configurado. Se Ollama falhar, não há fallback disponível.')
    }

    if (test && !test.success && test.latencyMs > 45000) {
        recs.push('⏱️ Todos os providers estão lentos ou falhando. O cron pode estar com timeout.')
    }

    if (test?.success && test.latencyMs > 10000) {
        recs.push(`⏱️ Latência alta: ${test.latencyMs}ms. Considere usar modelo mais rápido ou outro provider.`)
    }

    if (test?.success && test.latencyMs < 3000) {
        recs.push(`✅ Latência boa: ${test.latencyMs}ms. Pipeline de AI está funcionando bem.`)
    }

    if (recs.length === 0) {
        recs.push('✅ Tudo parece configurado corretamente.')
    }

    return recs
}
