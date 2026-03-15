/**
 * AI Provider Configuration
 * Configurações centralizadas para todos os providers de IA
 */

export type AIProviderType = 'ollama' | 'deepseek';

export interface AIProviderConfig {
  name: AIProviderType;
  displayName: string;
  enabled: boolean;
  priority: number; // Menor = maior prioridade
  costPer1kTokens: number; // Em USD
  rateLimit: {
    requestsPerMinute: number;
    tokensPerMinute?: number;
  };
  models: {
    default: string;
    alternatives?: string[];
  };
}

export interface GenerateOptions {
  temperature?: number;
  maxTokens?: number;
  preferredProvider?: AIProviderType;
  systemPrompt?: string;
  excludeList?: string[];
  /** Feature que originou a chamada — usada para logging de uso */
  feature?: import('./ai-usage-logger').AiFeature;
}

export interface GenerationResult {
  content: string;
  provider: AIProviderType;
  model: string;
  tokensUsed?: number;
  tokensIn?: number;
  tokensOut?: number;
  cost?: number;
}

export interface OrchestratorStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalCost: number;
  providerStats: Record<AIProviderType, {
    requests: number;
    failures: number;
    tokensUsed: number;
    cost: number;
  }>;
}

// Configurações padrão dos providers
export const PROVIDER_CONFIGS: Record<AIProviderType, AIProviderConfig> = {
  deepseek: {
    name: 'deepseek',
    displayName: 'DeepSeek',
    enabled: true,
    priority: 1, // Alta prioridade — barato e rápido
    costPer1kTokens: 0.00027, // DeepSeek-V3: $0.27/MTok input
    rateLimit: {
      requestsPerMinute: 60,
      tokensPerMinute: 60000,
    },
    models: {
      default: 'deepseek-chat', // DeepSeek-V3
      alternatives: ['deepseek-reasoner'],
    },
  },
  ollama: {
    name: 'ollama',
    displayName: 'Local Ollama',
    enabled: true,
    priority: 0, // Prioritário por ser local e gratuito
    costPer1kTokens: 0,
    rateLimit: {
      requestsPerMinute: 60,
    },
    models: {
      // Permite configurar modelo por ambiente via OLLAMA_MODEL
      // Production: phi3 (melhor qualidade)
      // Staging: tinyllama (mais rápido)
      default: process.env.OLLAMA_MODEL || 'phi3',
      alternatives: ['mistral', 'llama3:8b', 'tinyllama'],
    },
  },
};

// Prompts do sistema para diferentes tipos de geração
export const SYSTEM_PROMPTS = {
  news: `Você é um especialista em cultura coreana (K-Pop e K-Drama) que escreve notícias em português brasileiro.
Suas notícias devem ser:
- Precisas e baseadas em fatos reais
- Escritas em português brasileiro fluente
- Engajantes e interessantes para fãs
- Com títulos chamativos mas não sensacionalistas
- Focadas em eventos recentes (últimos 3 meses)`,

  artist: `Você é um especialista em artistas coreanos (K-Pop e K-Drama) que cria perfis detalhados.
Suas descrições devem:
- Ser precisas e baseadas em informações reais
- Estar em português brasileiro
- Incluir informações relevantes sobre carreira
- Ser respeitosas e profissionais
- Focar em artistas ativos e relevantes`,

  production: `Você é um especialista em produções coreanas (K-Dramas, filmes, programas) que cria sinopses.
Suas sinopses devem:
- Ser precisas e baseadas em produções reais
- Estar em português brasileiro
- Ser envolventes sem spoilers
- Incluir informações sobre plataformas de streaming
- Focar em produções recentes (últimos 2 anos)`,
};
