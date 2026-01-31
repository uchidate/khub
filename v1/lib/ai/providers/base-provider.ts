import type { AIProviderType, GenerateOptions, GenerationResult } from '../ai-config';

/**
 * Classe base abstrata para todos os providers de IA
 */
export abstract class BaseAIProvider {
    protected name: AIProviderType;
    protected apiKey: string;
    protected requestCount: number = 0;
    protected failureCount: number = 0;
    protected totalTokensUsed: number = 0;
    protected totalCost: number = 0;
    protected lastRequestTime: number = 0;

    constructor(name: AIProviderType, apiKey: string) {
        this.name = name;
        this.apiKey = apiKey;
    }

    /**
     * Verifica se o provider está configurado e disponível
     */
    isAvailable(): boolean {
        return !!this.apiKey && this.apiKey.length > 0;
    }

    /**
     * Gera texto usando o provider
     */
    abstract generate(prompt: string, options?: GenerateOptions): Promise<GenerationResult>;

    /**
     * Gera conteúdo estruturado (JSON)
     */
    async generateStructured<T>(
        prompt: string,
        schema: string,
        options?: GenerateOptions
    ): Promise<T> {
        const structuredPrompt = `${prompt}\n\nResponda APENAS com um JSON válido seguindo este schema:\n${schema}\n\nNão inclua nenhum texto adicional, apenas o JSON.`;

        const result = await this.generate(structuredPrompt, options);

        try {
            // Remove markdown code blocks se existirem
            let content = result.content.trim();
            if (content.startsWith('```json')) {
                content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
            } else if (content.startsWith('```')) {
                content = content.replace(/```\n?/g, '');
            }

            return JSON.parse(content) as T;
        } catch (error) {
            throw new Error(`Failed to parse JSON response from ${this.name}: ${error}`);
        }
    }

    /**
     * Aplica rate limiting
     */
    protected async applyRateLimit(requestsPerMinute: number): Promise<void> {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        const minTimeBetweenRequests = (60 * 1000) / requestsPerMinute;

        if (timeSinceLastRequest < minTimeBetweenRequests) {
            const waitTime = minTimeBetweenRequests - timeSinceLastRequest;
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }

        this.lastRequestTime = Date.now();
    }

    /**
     * Registra uma requisição bem-sucedida
     */
    protected recordSuccess(tokensUsed: number, cost: number): void {
        this.requestCount++;
        this.totalTokensUsed += tokensUsed;
        this.totalCost += cost;
    }

    /**
     * Registra uma falha
     */
    protected recordFailure(): void {
        this.failureCount++;
    }

    /**
     * Obtém estatísticas do provider
     */
    getStats() {
        return {
            requests: this.requestCount,
            failures: this.failureCount,
            tokensUsed: this.totalTokensUsed,
            cost: this.totalCost,
        };
    }

    /**
     * Reseta estatísticas
     */
    resetStats(): void {
        this.requestCount = 0;
        this.failureCount = 0;
        this.totalTokensUsed = 0;
        this.totalCost = 0;
    }

    /**
     * Nome do provider
     */
    getName(): AIProviderType {
        return this.name;
    }
}
