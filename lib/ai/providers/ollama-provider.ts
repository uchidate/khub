import { BaseAIProvider } from './base-provider';
import type { GenerateOptions, GenerationResult } from '../ai-config';
import { PROVIDER_CONFIGS } from '../ai-config';

// Timeout para inferência local com phi3:mini no CPU.
// phi3:mini (2.2GB): ~60-240s dependendo do hardware/carga.
// Baseado em dados reais de produção: timeouts ocorrendo em 240s com carga de 2 notícias.
// Aumentado para 20min com margem de segurança para evitar falhas durante picos de uso.
const OLLAMA_TIMEOUT_MS = 1_200_000; // 20 minutos

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
     *   - strings não terminadas, vírgulas faltando, aspas quebradas
     */
    async generateStructured<T>(
        prompt: string,
        schema: string,
        options?: GenerateOptions
    ): Promise<T> {
        const structuredPrompt = `${prompt}\n\nResponda APENAS com um JSON válido seguindo este schema:\n${schema}\n\nNão inclua nenhum texto adicional, apenas o JSON.`;

        const result = await this.generate(structuredPrompt, options);
        const raw = result.content;

        // Tentativa 1: Parse direto após sanitização
        try {
            const sanitized = this.extractAndSanitizeJson(raw);
            return JSON.parse(sanitized) as T;
        } catch (firstError: any) {
            // Tentativa 2: Aplicar correções agressivas
            try {
                const aggressiveClean = this.aggressiveJsonFix(raw);
                return JSON.parse(aggressiveClean) as T;
            } catch (secondError: any) {
                // Log detalhado para debug
                console.error('[Ollama] Failed to parse JSON after all corrections');
                console.error('[Ollama] Original response length:', raw.length);
                console.error('[Ollama] First 200 chars:', raw.substring(0, 200));
                console.error('[Ollama] Parse errors:', {
                    first: firstError.message,
                    second: secondError.message
                });

                throw new Error(`Failed to parse JSON response from ollama after all corrections: ${secondError.message}`);
            }
        }
    }

    /**
     * Correções agressivas para JSON muito mal formatado.
     * Usa estratégias mais drásticas que podem alterar conteúdo, mas melhoram parsing.
     * IMPORTANTE: Preserva caracteres acentuados (Latin-1) essenciais para português.
     */
    private aggressiveJsonFix(text: string): string {
        let content = this.extractAndSanitizeJson(text);

        // 1. Remove APENAS caracteres de controle (0x00-0x1f, 0x7f)
        // PRESERVA acentos Latin-1 (áàâãéêíóôõúüçÁÀÂÃÉÊÍÓÔÕÚÜÇ etc.)
        // Bug anterior: /[^\x20-\x7E\n\r]/g destruía todos os acentos!
        // eslint-disable-next-line no-control-regex
        content = content.replace(/[\x00-\x1f\x7f]/g, ' ');

        // 2. Fix para aspas duplas dentro de strings (escape incorreto)
        // Padrão: "text "word" more" → "text \"word\" more"
        content = content.replace(/"([^"]*)"([^"]*)"([^"]*?)"/g, (match, p1, p2, p3) => {
            if (p2.includes(':')) {
                // É uma nova propriedade, não deve ser escapada
                return match;
            }
            return `"${p1}\\"${p2}\\"${p3}"`;
        });

        // 3. Trunca strings muito longas (>2000 chars) que podem ter problemas
        content = content.replace(/"([^"]{2000,})"/g, (match, longString) => {
            return `"${longString.substring(0, 1500)}... (truncated)"`;
        });

        // 4. Remove propriedades com valores vazios ou inválidos
        content = content.replace(/"([^"]+)":\s*""\s*,?/g, '');
        content = content.replace(/"([^"]+)":\s*null\s*,?/g, '');

        // 5. Garante que o JSON começa com { e termina com }
        if (!content.startsWith('{')) {
            content = '{' + content;
        }
        if (!content.endsWith('}')) {
            content = content + '}';
        }

        // 6. Remove múltiplas vírgulas consecutivas
        content = content.replace(/,+/g, ',');

        // 7. Remove vírgula antes de }
        content = content.replace(/,(\s*)\}/g, '$1}');

        return content;
    }

    /**
     * Extrai o objeto JSON do texto e sanitiza caracteres de controle.
     * Também tenta corrigir JSON mal formatado gerado por modelos locais.
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
        // eslint-disable-next-line no-control-regex
        content = content.replace(/[\x00-\x1f\x7f]/g, ' ');

        // CORREÇÕES ADICIONAIS para JSON mal formatado por modelos locais (gemma:2b, tinyllama)

        // 1. Fix strings não terminadas (falta aspas no final)
        // Detecta padrão: "key": "value sem aspas final,
        content = content.replace(/"([^"]+)":\s*"([^"]*?)(\n|,|\})/g, (match, key, value, terminator) => {
            // Se o valor não termina com aspas, adiciona
            if (!match.includes(`"${value}"`)) {
                return `"${key}": "${value}"${terminator}`;
            }
            return match;
        });

        // 2. Fix vírgulas faltando entre propriedades
        // Padrão: }"key": deve ser },"key":
        content = content.replace(/\}(\s*)"(\w+)":/g, '},$1"$2":');
        // Padrão: "value""key": deve ser "value","key":
        content = content.replace(/"(\s*)"(\w+)":/g, '",$1"$2":');

        // 3. Remove vírgulas extras antes de }
        content = content.replace(/,(\s*)\}/g, '$1}');

        // 4. Fix quebras de linha dentro de strings (substitui por \n)
        content = content.replace(/"([^"]*)\n([^"]*?)"/g, (match, before, after) => {
            return `"${before}\\n${after}"`;
        });

        // 5. Decodifica HTML entities que possam ter vindo do RSS
        content = content.replace(/&quot;/g, '\\"');
        content = content.replace(/&amp;/g, '&');
        content = content.replace(/&lt;/g, '<');
        content = content.replace(/&gt;/g, '>');
        content = content.replace(/&#8217;/g, "'");
        content = content.replace(/&#8216;/g, "'");
        content = content.replace(/&#8230;/g, '...');
        content = content.replace(/&hellip;/g, '...');

        return content;
    }
}
