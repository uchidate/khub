/**
 * AI Provider Configuration
 * Configurações centralizadas para todos os providers de IA
 */

export type AIProviderType = 'gemini' | 'openai' | 'claude';

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
}

export interface GenerationResult {
  content: string;
  provider: AIProviderType;
  model: string;
  tokensUsed?: number;
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
  gemini: {
    name: 'gemini',
    displayName: 'Google Gemini',
    enabled: true,
    priority: 1, // Maior prioridade (gratuito)
    costPer1kTokens: 0, // Tier gratuito
    rateLimit: {
      requestsPerMinute: 15, // Limite do tier gratuito
      tokensPerMinute: 1000000,
    },
    models: {
      default: 'gemini-2.0-flash-exp',
      alternatives: ['gemini-1.5-flash', 'gemini-1.5-pro'],
    },
  },
  openai: {
    name: 'openai',
    displayName: 'OpenAI',
    enabled: true,
    priority: 2,
    costPer1kTokens: 0.00015, // gpt-4o-mini
    rateLimit: {
      requestsPerMinute: 500,
      tokensPerMinute: 200000,
    },
    models: {
      default: 'gpt-4o-mini',
      alternatives: ['gpt-3.5-turbo'],
    },
  },
  claude: {
    name: 'claude',
    displayName: 'Anthropic Claude',
    enabled: true,
    priority: 3,
    costPer1kTokens: 0.00025, // claude-3-haiku
    rateLimit: {
      requestsPerMinute: 50,
      tokensPerMinute: 100000,
    },
    models: {
      default: 'claude-3-5-haiku-20241022',
      alternatives: ['claude-3-haiku-20240307'],
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
