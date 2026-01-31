import { GoogleGenerativeAI } from '@google/generative-ai';
import { BaseAIProvider } from './base-provider';
import { PROVIDER_CONFIGS } from '../ai-config';
import type { GenerateOptions, GenerationResult } from '../ai-config';

/**
 * Provider para Google Gemini
 */
export class GeminiProvider extends BaseAIProvider {
    private client: GoogleGenerativeAI;
    private config = PROVIDER_CONFIGS.gemini;

    constructor(apiKey: string) {
        super('gemini', apiKey);
        this.client = new GoogleGenerativeAI(apiKey);
    }

    async generate(prompt: string, options?: GenerateOptions): Promise<GenerationResult> {
        if (!this.isAvailable()) {
            throw new Error('Gemini provider is not configured');
        }

        try {
            // Rate limiting
            await this.applyRateLimit(this.config.rateLimit.requestsPerMinute);

            // Use the model name without 'models/' prefix
            const modelName = this.config.models.default;

            const model = this.client.getGenerativeModel({
                model: modelName,
                generationConfig: {
                    temperature: options?.temperature ?? 0.7,
                    maxOutputTokens: options?.maxTokens ?? 2048,
                },
            });

            const fullPrompt = options?.systemPrompt
                ? `${options.systemPrompt}\n\n${prompt}`
                : prompt;

            const result = await model.generateContent(fullPrompt);
            const response = result.response;
            const text = response.text();

            // Estimar tokens (Gemini não retorna contagem exata sempre)
            const estimatedTokens = Math.ceil((fullPrompt.length + text.length) / 4);
            const cost = this.config.costPer1kTokens * (estimatedTokens / 1000);

            this.recordSuccess(estimatedTokens, cost);

            return {
                content: text,
                provider: 'gemini',
                model: modelName,
                tokensUsed: estimatedTokens,
                cost,
            };
        } catch (error: any) {
            this.recordFailure();
            throw new Error(`Gemini generation failed: ${error.message}`);
        }
    }
}
