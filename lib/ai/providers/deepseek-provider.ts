import OpenAI from 'openai'
import { BaseAIProvider } from './base-provider'
import { PROVIDER_CONFIGS } from '../ai-config'
import type { GenerateOptions, GenerationResult } from '../ai-config'

/**
 * Provider para DeepSeek (API compatível com OpenAI)
 * Modelo padrão: deepseek-chat (DeepSeek-V3)
 * Custo: ~$0.27/MTok input, $1.10/MTok output
 */
export class DeepSeekProvider extends BaseAIProvider {
    private client: OpenAI
    private config = PROVIDER_CONFIGS.deepseek

    constructor(apiKey: string) {
        super('deepseek', apiKey)
        this.client = new OpenAI({
            apiKey,
            baseURL: 'https://api.deepseek.com',
        })
    }

    async generate(prompt: string, options?: GenerateOptions): Promise<GenerationResult> {
        if (!this.isAvailable()) {
            throw new Error('DeepSeek provider is not configured')
        }

        try {
            await this.applyRateLimit(this.config.rateLimit.requestsPerMinute)

            const modelName = this.config.models.default
            const messages: OpenAI.Chat.ChatCompletionMessageParam[] = []

            if (options?.systemPrompt) {
                messages.push({ role: 'system', content: options.systemPrompt })
            }
            messages.push({ role: 'user', content: prompt })

            const completion = await this.client.chat.completions.create({
                model: modelName,
                messages,
                temperature: options?.temperature ?? 0.7,
                max_tokens: options?.maxTokens ?? 2048,
            })

            const text = completion.choices[0]?.message?.content || ''
            const tokensUsed = completion.usage?.total_tokens || 0
            const cost = this.config.costPer1kTokens * (tokensUsed / 1000)

            this.recordSuccess(tokensUsed, cost)

            return { content: text, provider: 'deepseek', model: modelName, tokensUsed, cost }
        } catch (error: any) {
            this.recordFailure()
            throw new Error(`DeepSeek generation failed: ${error.message}`)
        }
    }
}
