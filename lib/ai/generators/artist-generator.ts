import { AIOrchestrator } from '../orchestrator';
import { SYSTEM_PROMPTS } from '../ai-config';
import type { GenerateOptions } from '../ai-config';
import { ImageSearchService } from '../../services/image-search-service';

export interface ArtistData {
    nameRomanized: string;
    nameHangul: string;
    stageNames?: string;
    birthDate: Date;
    roles: string;
    bio: string;
    primaryImageUrl: string;
    agencyName: string;
}

/**
 * Gerador de dados de artistas K-Pop/K-Drama
 */
export class ArtistGenerator {
    private imageSearch: ImageSearchService;

    constructor(private orchestrator: AIOrchestrator) {
        this.imageSearch = new ImageSearchService();
    }

    /**
     * Gera dados de um artista
     */
    async generateArtist(options?: GenerateOptions): Promise<ArtistData> {
        let prompt = `Gere informações sobre um artista REAL e ATIVO de K-Pop ou K-Drama.

O artista deve ser:
- Alguém que está ativo atualmente (não aposentado)
- Relevante na indústria
- Pode ser idol, ator/atriz, ou ambos

Escolha artistas variados (diferentes grupos, agências, etc).`;

        if (options?.excludeList && options.excludeList.length > 0) {
            prompt += `\n\nIMPORTANTE: NÃO gere informações sobre nenhum dos seguintes artistas (já temos na base): ${options.excludeList.join(', ')}. Escolha outro artista relevante.`;
        }

        const schema = `{
  "nameRomanized": "string (nome romanizado, ex: 'Kim Taehyung')",
  "nameHangul": "string (nome em hangul, ex: '김태형')",
  "stageNames": "string (nomes artísticos separados por vírgula, ex: 'V, TaeTae')",
  "birthDate": "string (data de nascimento no formato YYYY-MM-DD)",
  "roles": "string (papéis separados por vírgula, ex: 'CANTOR, ATOR, MODELO')",
  "bio": "string (biografia curta em português, 2-3 frases)",
  "primaryImageUrl": "string (URL de imagem do Unsplash relacionada a K-Pop/celebridade)",
  "agencyName": "string (nome da agência, ex: 'HYBE', 'SM Entertainment', 'YG Entertainment')"
}`;

        const result = await this.orchestrator.generateStructured<{
            nameRomanized: string;
            nameHangul: string;
            stageNames: string;
            birthDate: string;
            roles: string;
            bio: string;
            primaryImageUrl: string;
            agencyName: string;
        }>(prompt, schema, {
            ...options,
            systemPrompt: SYSTEM_PROMPTS.artist,
        });

        // Search for real artist image using Aliases
        const aliases = [];
        if (result.nameHangul) aliases.push(result.nameHangul);
        if (result.stageNames) {
            aliases.push(...result.stageNames.split(',').map(s => s.trim()));
        }

        console.log(`🔍 Searching for real image of ${result.nameRomanized} (Aliases: ${aliases.join(', ')})...`);
        const imageResult = await this.imageSearch.findArtistImage(result.nameRomanized, aliases);

        return {
            ...result,
            birthDate: new Date(result.birthDate),
            primaryImageUrl: imageResult?.url || result.primaryImageUrl, // Fallback to AI proposed URL if null (though findArtistImage returns placeholder now)
        };
    }

    /**
     * Gera múltiplos artistas
     */
    async generateMultipleArtists(count: number, options?: GenerateOptions): Promise<ArtistData[]> {
        const artists: ArtistData[] = [];

        console.log(`🎤 Generating ${count} artists...`);

        for (let i = 0; i < count; i++) {
            try {
                console.log(`\n👤 Generating artist ${i + 1}/${count}...`);
                const artist = await this.generateArtist(options);
                artists.push(artist);
                console.log(`✅ Generated: ${artist.nameRomanized} (${artist.nameHangul})`);
            } catch (error: any) {
                console.error(`❌ Failed to generate artist ${i + 1}: ${error.message}`);
            }
        }

        return artists;
    }
}
