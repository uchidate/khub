import { BaseAIProvider } from './base-provider';
import type { GenerateOptions, GenerationResult } from '../ai-config';
import { PROVIDER_CONFIGS } from '../ai-config';

/**
 * Provider para Ollama (modelo local)
 * Usa a API REST do Ollama rodando em localhost:11434
 */
export class OllamaProvider extends BaseAIProvider {
    private baseUrl: string;
    private config = PROVIDER_CONFIGS.ollama;

    constructor(baseUrl: string = 'http://localhost:11434') {
        // Ollama não precisa de API key, mas passamos uma string vazia para o construtor base
        super('ollama', '');
        this.baseUrl = baseUrl;
    }

    /**
     * Ollama está disponível se conseguir se conectar ao servidor
     */
    isAvailable(): boolean {
        // Para Ollama, consideramos disponível se a URL base estiver configurada
        return !!this.baseUrl;
    }

    /**
     * Gera texto usando Ollama
     */
    async generate(prompt: string, options?: GenerateOptions): Promise<GenerationResult> {
        try {
            // Rate limiting
            await this.applyRateLimit(this.config.rateLimit.requestsPerMinute);

            const modelName = options?.preferredProvider === 'ollama'
                ? this.config.models.default
                : this.config.models.default;

            const response = await fetch(`${this.baseUrl}/api/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: modelName,
                    prompt: options?.systemPrompt
                        ? `${options.systemPrompt}\n\n${prompt}`
                        : prompt,
                    stream: false,
                    options: {
                        temperature: options?.temperature ?? 0.7,
                        num_predict: options?.maxTokens ?? 2000,
                    },
                }),
            });

            if (!response.ok) {
                throw new Error(`Ollama request failed: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            const content = data.response;

            // Estimar tokens (aproximadamente)
            const tokensUsed = Math.ceil((prompt.length + content.length) / 4);
            const cost = 0; // Ollama é gratuito

            this.recordSuccess(tokensUsed, cost);

            return {
                content,
                provider: 'ollama',
                model: modelName,
                tokensUsed,
                cost,
            };
        } catch (error: any) {
            this.recordFailure();
            throw new Error(`Ollama generation failed: ${error.message}`);
        }
    }
}
