import Anthropic from '@anthropic-ai/sdk';
import { BaseAIProvider } from './base-provider';
import { PROVIDER_CONFIGS } from '../ai-config';
import type { GenerateOptions, GenerationResult } from '../ai-config';

/**
 * Provider para Anthropic Claude
 */
export class ClaudeProvider extends BaseAIProvider {
    private client: Anthropic;
    private config = PROVIDER_CONFIGS.claude;

    constructor(apiKey: string) {
        super('claude', apiKey);
        this.client = new Anthropic({ apiKey });
    }

    async generate(prompt: string, options?: GenerateOptions): Promise<GenerationResult> {
        if (!this.isAvailable()) {
            throw new Error('Claude provider is not configured');
        }

        try {
            // Rate limiting
            await this.applyRateLimit(this.config.rateLimit.requestsPerMinute);

            const modelName = this.config.models.default;

            const message = await this.client.messages.create({
                model: modelName,
                max_tokens: options?.maxTokens ?? 2048,
                temperature: options?.temperature ?? 0.7,
                system: options?.systemPrompt,
                messages: [
                    { role: 'user', content: prompt }
                ],
            });

            const text = message.content[0]?.type === 'text'
                ? message.content[0].text
                : '';

            const tokensUsed = message.usage.input_tokens + message.usage.output_tokens;
            const cost = this.config.costPer1kTokens * (tokensUsed / 1000);

            this.recordSuccess(tokensUsed, cost);

            return {
                content: text,
                provider: 'claude',
                model: modelName,
                tokensUsed,
                cost,
            };
        } catch (error: any) {
            this.recordFailure();
            throw new Error(`Claude generation failed: ${error.message}`);
        }
    }
}
