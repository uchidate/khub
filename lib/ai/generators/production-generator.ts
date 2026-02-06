import { AIOrchestrator } from '../orchestrator';
import { SYSTEM_PROMPTS } from '../ai-config';
import type { GenerateOptions } from '../ai-config';

export interface ProductionData {
    titlePt: string;
    titleKr: string;
    type: 'SERIE' | 'FILME' | 'PROGRAMA';
    year: number;
    synopsis: string;
    streamingPlatforms: string;
    trailerUrl?: string;
}

/**
 * Gerador de dados de produções (K-Dramas, filmes, programas)
 */
export class ProductionGenerator {
    constructor(private orchestrator: AIOrchestrator) { }

    /**
     * Gera dados de uma produção
     */
    async generateProduction(options?: GenerateOptions): Promise<ProductionData> {
        let prompt = `Gere informações sobre uma produção coreana REAL e RECENTE (últimos 2 anos).

Pode ser:
- K-Drama (série)
- Filme coreano
- Reality show / Programa de variedades

A produção deve estar disponível em alguma plataforma de streaming.`;

        if (options?.excludeList && options.excludeList.length > 0) {
            prompt += `\n\nIMPORTANTE: NÃO gere informações sobre as seguintes produções (já temos na base): ${options.excludeList.join(', ')}. Escolha uma produção diferente.`;
        }

        const schema = `{
  "titlePt": "string (título em português)",
  "titleKr": "string (título em coreano/hangul)",
  "type": "string (SERIE, FILME ou PROGRAMA)",
  "year": "number (ano de lançamento, 2023 ou 2024)",
  "synopsis": "string (sinopse em português, 2-3 frases, sem spoilers)",
  "streamingPlatforms": "string (plataformas separadas por vírgula, ex: 'Netflix, Viki')",
  "trailerUrl": "string (URL real do trailer no YouTube, ex: 'https://www.youtube.com/watch?v=...') "
}`;

        const result = await this.orchestrator.generateStructured<ProductionData>(
            prompt,
            schema,
            {
                ...options,
                systemPrompt: SYSTEM_PROMPTS.production,
            }
        );

        return result;
    }

    /**
     * Gera múltiplas produções
     */
    async generateMultipleProductions(count: number, options?: GenerateOptions): Promise<ProductionData[]> {
        const productions: ProductionData[] = [];

        console.log(`🎬 Generating ${count} productions...`);

        for (let i = 0; i < count; i++) {
            try {
                console.log(`\n📺 Generating production ${i + 1}/${count}...`);
                const production = await this.generateProduction(options);
                productions.push(production);
                console.log(`✅ Generated: ${production.titlePt} (${production.titleKr})`);
            } catch (error: any) {
                console.error(`❌ Failed to generate production ${i + 1}: ${error.message}`);
            }
        }

        return productions;
    }
}
