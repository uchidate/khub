import { BaseAIProvider } from './providers/base-provider';
import { GeminiProvider } from './providers/gemini-provider';
import { OpenAIProvider } from './providers/openai-provider';
import { ClaudeProvider } from './providers/claude-provider';
import { OllamaProvider } from './providers/ollama-provider';
import { PROVIDER_CONFIGS } from './ai-config';
import type { AIProviderType, GenerateOptions, GenerationResult, OrchestratorStats } from './ai-config';

/**
 * Orquestrador de múltiplos providers de IA
 * Gerencia load balancing, fallback e tracking de uso
 */
export class AIOrchestrator {
    private providers: Map<AIProviderType, BaseAIProvider> = new Map();
    private availableProviders: AIProviderType[] = [];
    private currentProviderIndex: number = 0;
    private totalRequests: number = 0;
    private successfulRequests: number = 0;
    private failedRequests: number = 0;
    private maxRetries: number = 3;

    constructor(config: {
        geminiApiKey?: string;
        openaiApiKey?: string;
        claudeApiKey?: string;
        ollamaBaseUrl?: string;
        maxRetries?: number;
    }) {
        // Inicializar providers disponíveis
        if (config.geminiApiKey) {
            this.providers.set('gemini', new GeminiProvider(config.geminiApiKey));
        }
        if (config.openaiApiKey) {
            this.providers.set('openai', new OpenAIProvider(config.openaiApiKey));
        }
        if (config.claudeApiKey) {
            this.providers.set('claude', new ClaudeProvider(config.claudeApiKey));
        }
        // Ollama só ativado se a URL for explicitamente configurada
        const ollamaUrl = config.ollamaBaseUrl || process.env.OLLAMA_BASE_URL;
        if (ollamaUrl) {
            this.providers.set('ollama', new OllamaProvider(ollamaUrl));
        }

        if (config.maxRetries !== undefined) {
            this.maxRetries = config.maxRetries;
        }

        // Ordenar providers por prioridade (menor número = maior prioridade)
        this.availableProviders = Array.from(this.providers.keys())
            .filter(name => this.providers.get(name)?.isAvailable())
            .sort((a, b) => PROVIDER_CONFIGS[a].priority - PROVIDER_CONFIGS[b].priority);

        if (this.availableProviders.length === 0) {
            throw new Error('No AI providers configured. Please set at least one API key.');
        }

        console.log(`🤖 AI Orchestrator initialized with providers: ${this.availableProviders.join(', ')}`);
    }

    /**
     * Gera conteúdo usando o melhor provider disponível
     */
    async generate(prompt: string, options?: GenerateOptions): Promise<GenerationResult> {
        this.totalRequests++;

        const preferredProvider = options?.preferredProvider;
        let providersToTry: AIProviderType[];

        if (preferredProvider && this.availableProviders.includes(preferredProvider)) {
            // Tentar provider preferido primeiro, depois os outros
            providersToTry = [
                preferredProvider,
                ...this.availableProviders.filter(p => p !== preferredProvider)
            ];
        } else {
            // Round-robin entre providers disponíveis
            providersToTry = this.getProvidersInRoundRobinOrder();
        }

        let lastError: Error | null = null;
        let attempts = 0;

        for (const providerName of providersToTry) {
            if (attempts >= this.maxRetries) {
                break;
            }

            const provider = this.providers.get(providerName);
            if (!provider) continue;

            try {
                console.log(`🔄 Attempting generation with ${providerName}...`);
                const result = await provider.generate(prompt, options);
                this.successfulRequests++;
                console.log(`✅ Successfully generated with ${providerName}`);
                return result;
            } catch (error: any) {
                lastError = error;
                attempts++;
                console.warn(`⚠️  ${providerName} failed (attempt ${attempts}): ${error.message}`);
            }
        }

        this.failedRequests++;
        throw new Error(
            `All providers failed after ${attempts} attempts. Last error: ${lastError?.message}`
        );
    }

    /**
     * Gera conteúdo estruturado (JSON)
     */
    async generateStructured<T>(
        prompt: string,
        schema: string,
        options?: GenerateOptions
    ): Promise<T> {
        const preferredProvider = options?.preferredProvider;
        let providersToTry: AIProviderType[];

        if (preferredProvider && this.availableProviders.includes(preferredProvider)) {
            providersToTry = [
                preferredProvider,
                ...this.availableProviders.filter(p => p !== preferredProvider)
            ];
        } else {
            providersToTry = this.getProvidersInRoundRobinOrder();
        }

        let lastError: Error | null = null;
        let attempts = 0;

        for (const providerName of providersToTry) {
            if (attempts >= this.maxRetries) {
                break;
            }

            const provider = this.providers.get(providerName);
            if (!provider) continue;

            try {
                console.log(`🔄 Attempting structured generation with ${providerName}...`);
                const result = await provider.generateStructured<T>(prompt, schema, options);
                console.log(`✅ Successfully generated structured data with ${providerName}`);
                return result;
            } catch (error: any) {
                lastError = error;
                attempts++;
                console.warn(`⚠️  ${providerName} failed (attempt ${attempts}): ${error.message}`);
            }
        }

        throw new Error(
            `All providers failed for structured generation after ${attempts} attempts. Last error: ${lastError?.message}`
        );
    }

    /**
     * Obtém providers em ordem round-robin
     */
    private getProvidersInRoundRobinOrder(): AIProviderType[] {
        const providers = [...this.availableProviders];
        const startIndex = this.currentProviderIndex % providers.length;
        this.currentProviderIndex++;

        return [
            ...providers.slice(startIndex),
            ...providers.slice(0, startIndex)
        ];
    }

    /**
     * Obtém estatísticas de uso
     */
    getStats(): OrchestratorStats {
        const providerStats: Record<string, any> = {};

        Array.from(this.providers.entries()).forEach(([name, provider]) => {
            providerStats[name] = provider.getStats();
        });

        return {
            totalRequests: this.totalRequests,
            successfulRequests: this.successfulRequests,
            failedRequests: this.failedRequests,
            totalCost: Object.values(providerStats).reduce((sum: number, stats: any) => sum + stats.cost, 0),
            providerStats: providerStats as any,
        };
    }

    /**
     * Reseta estatísticas
     */
    resetStats(): void {
        this.totalRequests = 0;
        this.successfulRequests = 0;
        this.failedRequests = 0;

        Array.from(this.providers.values()).forEach(provider => {
            provider.resetStats();
        });
    }

    /**
     * Lista providers disponíveis
     */
    getAvailableProviders(): AIProviderType[] {
        return [...this.availableProviders];
    }
}
