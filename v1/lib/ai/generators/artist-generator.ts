import { AIOrchestrator } from '../orchestrator';
import { SYSTEM_PROMPTS } from '../ai-config';
import type { GenerateOptions } from '../ai-config';

export interface ArtistData {
    nameRomanized: string;
    nameHangul: string;
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
    constructor(private orchestrator: AIOrchestrator) { }

    /**
     * Gera dados de um artista
     */
    async generateArtist(options?: GenerateOptions): Promise<ArtistData> {
        const prompt = `Gere informações sobre um artista REAL e ATIVO de K-Pop ou K-Drama.

O artista deve ser:
- Alguém que está ativo atualmente (não aposentado)
- Relevante na indústria
- Pode ser idol, ator/atriz, ou ambos

Escolha artistas variados (diferentes grupos, agências, etc).`;

        const schema = `{
  "nameRomanized": "string (nome romanizado, ex: 'Kim Taehyung')",
  "nameHangul": "string (nome em hangul, ex: '김태형')",
  "birthDate": "string (data de nascimento no formato YYYY-MM-DD)",
  "roles": "string (papéis separados por vírgula, ex: 'CANTOR, ATOR, MODELO')",
  "bio": "string (biografia curta em português, 2-3 frases)",
  "primaryImageUrl": "string (URL de imagem do Unsplash relacionada a K-Pop/celebridade)",
  "agencyName": "string (nome da agência, ex: 'HYBE', 'SM Entertainment', 'YG Entertainment')"
}`;

        const result = await this.orchestrator.generateStructured<{
            nameRomanized: string;
            nameHangul: string;
            birthDate: string;
            roles: string;
            bio: string;
            primaryImageUrl: string;
            agencyName: string;
        }>(prompt, schema, {
            ...options,
            systemPrompt: SYSTEM_PROMPTS.artist,
        });

        return {
            ...result,
            birthDate: new Date(result.birthDate),
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
