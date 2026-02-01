import { BaseAIProvider } from './base-provider';
import type { GenerateOptions, GenerationResult } from '../ai-config';
import { PROVIDER_CONFIGS } from '../ai-config';

// Timeout alto para inferência em CPU (phi3 no CPU leva ~4 min por resposta)
const OLLAMA_TIMEOUT_MS = 300_000;

/**
 * Provider para Ollama (modelo local)
 * Usa a API REST do Ollama rodando em localhost:11434
 */
export class OllamaProvider extends BaseAIProvider {
    private baseUrl: string;
    private config = PROVIDER_CONFIGS.ollama;

    constructor(baseUrl: string = 'http://localhost:11434') {
        super('ollama', '');
        this.baseUrl = baseUrl;
    }

    isAvailable(): boolean {
        return !!this.baseUrl;
    }

    async generate(prompt: string, options?: GenerateOptions): Promise<GenerationResult> {
        try {
            await this.applyRateLimit(this.config.rateLimit.requestsPerMinute);

            const modelName = this.config.models.default;
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), OLLAMA_TIMEOUT_MS);

            let response: Response;
            try {
                response = await fetch(`${this.baseUrl}/api/generate`, {
                    method: 'POST',
                    signal: controller.signal,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        model: modelName,
                        prompt: options?.systemPrompt
                            ? `${options.systemPrompt}\n\n${prompt}`
                            : prompt,
                        stream: false,
                        options: {
                            temperature: options?.temperature ?? 0.7,
                            num_predict: options?.maxTokens ?? 512,
                        },
                    }),
                });
            } finally {
                clearTimeout(timeout);
            }

            if (!response.ok) {
                throw new Error(`Ollama request failed: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            const content = data.response;
            const tokensUsed = Math.ceil((prompt.length + content.length) / 4);

            this.recordSuccess(tokensUsed, 0);

            return { content, provider: 'ollama', model: modelName, tokensUsed, cost: 0 };
        } catch (error: any) {
            this.recordFailure();
            if (error.name === 'AbortError') {
                throw new Error(`Ollama timed out after ${OLLAMA_TIMEOUT_MS / 1000}s`);
            }
            throw new Error(`Ollama generation failed: ${error.message}`);
        }
    }

    /**
     * Override do método base para tratar o JSON quebrado que modelos locais produzem.
     * Problemas comuns do ollama:
     *   - caracteres de controle literais dentro de strings (quebra JSON.parse)
     *   - texto extra antes/depois do objeto JSON
     *   - markdown code blocks (```json ... ```)
     */
    async generateStructured<T>(
        prompt: string,
        schema: string,
        options?: GenerateOptions
    ): Promise<T> {
        const structuredPrompt = `${prompt}\n\nResponda APENAS com um JSON válido seguindo este schema:\n${schema}\n\nNão inclua nenhum texto adicional, apenas o JSON.`;

        const result = await this.generate(structuredPrompt, options);
        const raw = result.content;

        try {
            return JSON.parse(this.extractAndSanitizeJson(raw)) as T;
        } catch (error) {
            throw new Error(`Failed to parse JSON response from ollama: ${error}`);
        }
    }

    /**
     * Extrai o objeto JSON do texto e sanitiza caracteres de controle.
     */
    private extractAndSanitizeJson(text: string): string {
        let content = text.trim();

        // Remove markdown code blocks
        if (content.startsWith('```json')) {
            content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        } else if (content.startsWith('```')) {
            content = content.replace(/```\n?/g, '');
        }

        // Extrai apenas o objeto JSON (do primeiro { ao último })
        const start = content.indexOf('{');
        const end = content.lastIndexOf('}');
        if (start !== -1 && end !== -1 && end > start) {
            content = content.slice(start, end + 1);
        }

        // Sanitiza caracteres de controle (causa "Bad control character in string literal")
        // Substitui por espaço — não afeta o conteúdo gerado, só quebrava o parse
        content = content.replace(/[\x00-\x1f\x7f]/g, ' ');

        return content;
    }
}
