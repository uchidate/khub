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

    // Circuit breaker: evita tentativas repetidas em providers que estão falhando
    private consecutiveFailures: number = 0;
    private circuitOpenedAt: number | null = null;
    private readonly CIRCUIT_FAILURE_THRESHOLD = 3;     // Abre após 3 falhas consecutivas
    private readonly CIRCUIT_COOLDOWN_MS = 10 * 60 * 1000; // Fecha após 10 minutos

    /**
     * Verifica se o circuit breaker está aberto (provider bloqueado temporariamente)
     */
    isCircuitOpen(): boolean {
        if (this.circuitOpenedAt === null) return false;
        const elapsed = Date.now() - this.circuitOpenedAt;
        if (elapsed >= this.CIRCUIT_COOLDOWN_MS) {
            // Cooldown expirou — fechar o circuito e deixar tentar de novo
            this.circuitOpenedAt = null;
            this.consecutiveFailures = 0;
            console.log(`🔄 Circuit breaker [${this.name}]: resetado após cooldown`);
            return false;
        }
        return true;
    }

    /**
     * Retorna quanto tempo falta para o circuit fechar (em segundos), ou 0 se fechado
     */
    getCircuitCooldownRemaining(): number {
        if (this.circuitOpenedAt === null) return 0;
        const elapsed = Date.now() - this.circuitOpenedAt;
        return Math.max(0, Math.ceil((this.CIRCUIT_COOLDOWN_MS - elapsed) / 1000));
    }

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
        _schema: string,
        options?: GenerateOptions
    ): Promise<GenerationResult & { parsed: T }> {
        const result = await this.generate(prompt, { ...options, json_mode: true })

        try {
            let content = result.content.trim()
            if (content.startsWith('```json')) {
                content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '')
            } else if (content.startsWith('```')) {
                content = content.replace(/```\n?/g, '')
            }

            return { ...result, parsed: JSON.parse(content) as T }
        } catch (error) {
            throw new Error(`Failed to parse JSON response from ${this.name}: ${error}`)
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
     * Registra uma requisição bem-sucedida (reseta circuit breaker)
     */
    protected recordSuccess(tokensUsed: number, cost: number): void {
        this.requestCount++;
        this.totalTokensUsed += tokensUsed;
        this.totalCost += cost;
        this.consecutiveFailures = 0;
        this.circuitOpenedAt = null;
    }

    /**
     * Registra uma falha (pode abrir o circuit breaker)
     */
    protected recordFailure(): void {
        this.failureCount++;
        this.consecutiveFailures++;
        if (this.consecutiveFailures >= this.CIRCUIT_FAILURE_THRESHOLD) {
            this.circuitOpenedAt = Date.now();
            console.warn(`⚡ Circuit breaker [${this.name}]: ABERTO após ${this.consecutiveFailures} falhas. Bloqueado por ${this.CIRCUIT_COOLDOWN_MS / 60000}min`);
        }
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
            circuitOpen: this.isCircuitOpen(),
            circuitCooldownRemaining: this.getCircuitCooldownRemaining(),
            consecutiveFailures: this.consecutiveFailures,
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
        this.consecutiveFailures = 0;
        this.circuitOpenedAt = null;
    }

    /**
     * Nome do provider
     */
    getName(): AIProviderType {
        return this.name;
    }
}
