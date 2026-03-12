/**
 * AIOrchestrator Factory - Singleton Pattern
 *
 * Garante que apenas uma instância do AIOrchestrator seja criada
 * durante a execução da aplicação, evitando overhead de inicialização
 * e permitindo estatísticas agregadas corretas.
 *
 * Benefícios:
 * - Reduz 6 instanciações → 1 por execução do cron
 * - Rate limiting compartilhado entre todos os geradores
 * - Estatísticas de uso consolidadas
 * - Economia de memória
 */

import { AIOrchestrator } from './orchestrator'

let _instance: AIOrchestrator | null = null

/**
 * Retorna a instância única do AIOrchestrator
 * Cria uma nova instância apenas na primeira chamada
 */
export function getOrchestrator(): AIOrchestrator {
  if (!_instance) {
    _instance = new AIOrchestrator({
      // geminiApiKey: process.env.GEMINI_API_KEY, // DESABILITADO: API key expirada
      openaiApiKey:   process.env.OPENAI_API_KEY,
      claudeApiKey:   process.env.ANTHROPIC_API_KEY,
      deepseekApiKey: process.env.DEEPSEEK_API_KEY,
      ollamaBaseUrl:  process.env.OLLAMA_BASE_URL,
    })

    console.log('✅ AIOrchestrator singleton criado')
    console.log('📊 Providers disponíveis:', _instance.getAvailableProviders())
  }

  return _instance
}

/**
 * Reseta a instância do orchestrator
 * Útil para testes ou quando precisar reinicializar
 */
export function resetOrchestrator(): void {
  if (_instance) {
    console.log('🔄 Resetando AIOrchestrator singleton')
    _instance = null
  }
}

/**
 * Retorna estatísticas de uso do orchestrator
 * Retorna null se o orchestrator ainda não foi criado
 */
export function getOrchestratorStats() {
  if (!_instance) {
    return null
  }

  return _instance.getStats()
}
