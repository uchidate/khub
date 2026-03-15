import { PrismaClient } from '@prisma/client';
import { SYSTEM_PROMPTS } from '../ai-config';
import type { GenerateOptions } from '../ai-config';
import { ImageSearchService } from '../../services/image-search-service';
import { TMDBArtistService } from '../../services/tmdb-artist-service';
import { getOrchestrator } from '../orchestrator-factory';

export interface ArtistData {
    nameRomanized: string;
    nameHangul?: string;
    birthName?: string;
    stageNames?: string;
    birthDate?: Date;
    roles: string | string[];
    bio: string;
    primaryImageUrl: string;
    agencyName?: string;
    tmdbId?: number;
    height?: string;
    bloodType?: string;
    zodiacSign?: string;
}

// Cache de AI Discovery (1 hora de TTL = 4 execuções do cron)
interface CachedDiscovery {
    artists: string[];
    timestamp: number;
}

let _aiDiscoveryCache: CachedDiscovery | null = null;
const AI_DISCOVERY_CACHE_TTL = 3600000; // 1 hora em ms

/**
 * Gerador de dados de artistas K-Pop/K-Drama
 * ESTRATÉGIA: Prioriza artistas REAIS do TMDB + Ollama para bio
 *
 * OTIMIZAÇÕES:
 * - Usa singleton AIOrchestrator (via factory)
 * - Cache de AI Discovery (1h TTL) - economiza 3 chamadas Gemini/hora
 */
export class ArtistGenerator {
    private imageSearch: ImageSearchService;
    private tmdbService: TMDBArtistService;

    constructor(prisma?: PrismaClient) {
        this.imageSearch = new ImageSearchService();
        this.tmdbService = new TMDBArtistService(prisma);
    }

    /**
     * Retorna o orchestrator singleton
     */
    private getOrchestrator() {
        return getOrchestrator();
    }

    /**
     * Gera biografia em português usando Ollama (ou fallback)
     */
    private async generateBioWithOllama(artistName: string, roles: string[], biography?: string): Promise<string> {
        try {
            const prompt = `Gere uma biografia curta e envolvente em português brasileiro para o(a) artista ${artistName}.

${biography ? `Informações base (em inglês):\n${biography}\n\n` : ''}
Roles: ${roles.join(', ')}

Requisitos:
- 2-3 frases curtas e impactantes
- Foco em carreira e conquistas recentes
- Tom profissional mas acessível
- Mencione K-pop ou K-drama conforme relevante
- Não invente informações não fornecidas`;

            const bioResult = await this.getOrchestrator().generateStructured<{ bio: string }>(
                prompt,
                '{ "bio": "string (biografia em português, 2-3 frases)" }',
                {
                    preferredProvider: 'ollama', // Prioriza Ollama (gratuito)
                }
            );

            return bioResult.bio;
        } catch (error: any) {
            console.warn(`⚠️  Ollama bio generation failed: ${error.message}`);
            // Fallback para bio simples
            return biography
                ? `${artistName} é um(a) talentoso(a) ${roles.join('/')} da indústria do entretenimento coreano.`
                : `${artistName} é um(a) artista versátil, atuando como ${roles.join(', ').toLowerCase()}.`;
        }
    }

    /**
     * Descobre nomes de artistas reais via AI (Gemini/Ollama)
     * CACHE: 1 hora de TTL - economiza 3 chamadas Gemini/hora (75% das execuções)
     */
    private async discoverArtistNamesViaAI(excludeList: string[] = []): Promise<string[]> {
        const now = Date.now();

        // Verifica cache
        if (_aiDiscoveryCache && (now - _aiDiscoveryCache.timestamp) < AI_DISCOVERY_CACHE_TTL) {
            const cacheAge = Math.round((now - _aiDiscoveryCache.timestamp) / 60000);
            console.log(`♻️  Using cached AI discovery (${cacheAge} min old)`);
            return _aiDiscoveryCache.artists;
        }

        console.log('🔍 Discovering trending artists via AI (cache miss)...');

        const prompt = `Gere uma lista de 10 artistas REAIS e ATIVOS da indústria coreana (K-pop idols ou atores de K-drama) que sejam muito populares atualmente.

        IMPORTANTE: NÃO inclua nenhum dos seguintes artistas na lista (pois já os temos):
        ${excludeList.slice(0, 50).join(', ')}

        Retorne apenas nomes reais e conhecidos internacionalmente (em inglês/romanizado).`;

        const schema = `{ "artists": ["string"] }`;

        try {
            const result = await this.getOrchestrator().generateStructured<{ artists: string[] }>(
                prompt,
                schema,
                { preferredProvider: 'deepseek' }
            );

            console.log(`✅ AI suggested: ${result.artists.join(', ')}`);

            // Atualiza cache
            _aiDiscoveryCache = {
                artists: result.artists,
                timestamp: now
            };
            console.log(`💾 Cached AI discovery (TTL: 1h)`);

            return result.artists;
        } catch (error: any) {
            console.warn(`⚠️ AI discovery failed: ${error.message}. Using safe fallbacks.`);
            // Fallback para nomes muito famosos caso a AI falhe totalmente
            const fallback = ['Kim Soo-hyun', 'Park Eun-bin', 'Song Kang', 'Han So-hee', 'Cha Eun-woo'];

            // Cache fallback também (para não ficar chamando AI se está falhando)
            _aiDiscoveryCache = {
                artists: fallback,
                timestamp: now
            };

            return fallback;
        }
    }

    /**
     * Enriquecimento de dados biográficos via Gemini
     */
    private async enrichArtistMetaWithGemini(artistName: string, biography?: string): Promise<{
        birthName?: string;
        height?: string;
        bloodType?: string;
        zodiacSign?: string;
    }> {
        if (!biography) return {};

        try {
            const prompt = `Com base na biografia abaixo do artista ${artistName}, extraia as seguintes informações no formato JSON.

Biografia:
${biography}

Campos necessários:
- birthName: Nome real/nascimento (ex: 'Kim Seok-jin')
- height: Altura (ex: '179 cm')
- bloodType: Tipo sanguíneo (ex: 'O', 'A', 'B', 'AB')
- zodiacSign: Signo do zodíaco ou chinês (ex: 'Sagitário')

Se a informação não estiver na biografia, use seu conhecimento geral para preencher. Se for impossível determinar, deixe nulo.`;

            const result = await this.getOrchestrator().generateStructured<{
                birthName?: string;
                height?: string;
                bloodType?: string;
                zodiacSign?: string;
            }>(
                prompt,
                '{ "birthName": "string", "height": "string", "bloodType": "string", "zodiacSign": "string" }',
                { preferredProvider: 'deepseek' }
            );

            return result;
        } catch (error: any) {
            console.warn(`⚠️  Gemini meta enrichment failed for ${artistName}: ${error.message}`);
            return {};
        }
    }

    /**
     * Gera dados de um artista
     * NOVA ESTRATÉGIA: Usa TMDB como fonte primária + Ollama para bio + Gemini para Wiki Data
     */
    async generateArtist(options?: GenerateOptions, candidates: string[] = []): Promise<ArtistData> {
        const excludeList = options?.excludeList || [];

        // ESTRATÉGIA 1: Tentar encontrar artista REAL no TMDB (preferencial)
        console.log('🎯 Strategy: Searching TMDB for real artist...');

        // Se temos candidatos sugeridos pela AI, tentamos eles primeiro
        const realArtist = await this.tmdbService.findRandomRealArtist(candidates, excludeList);

        if (realArtist) {
            console.log(`✅ Found real artist from TMDB: ${realArtist.nameRomanized}`);

            // Enriquecer dados Wiki via Gemini
            const wikiData = await this.enrichArtistMetaWithGemini(
                realArtist.nameRomanized,
                realArtist.biography
            );

            // Gerar bio em português usando Ollama (gratuito)
            const bio = await this.generateBioWithOllama(
                realArtist.nameRomanized,
                realArtist.roles,
                realArtist.biography
            );

            return {
                nameRomanized: realArtist.nameRomanized,
                nameHangul: realArtist.nameHangul,
                birthName: wikiData.birthName || realArtist.birthName,
                birthDate: realArtist.birthDate,
                roles: realArtist.roles.join(', '),
                bio,
                primaryImageUrl: realArtist.profileImageUrl,
                tmdbId: realArtist.tmdbId,
                height: wikiData.height,
                bloodType: wikiData.bloodType,
                zodiacSign: wikiData.zodiacSign,
            };
        }

        // ESTRATÉGIA 2: Fallback para geração AI (apenas se TMDB falhar)
        console.warn('⚠️  TMDB search failed, falling back to AI generation (Gemini Free Tier)');

        let prompt = `Gere informações sobre um artista REAL e ATIVO de K-Pop ou K-Drama.

O artista deve ser:
- Alguém que está ativo atualmente (não aposentado)
- Relevante na indústria
- Pode ser idol, ator/atriz, ou ambos

Escolha artistas variados (diferentes grupos, agências, etc).`;

        if (excludeList.length > 0) {
            prompt += `\n\nIMPORTANTE: NÃO gere informações sobre nenhum dos seguintes artistas (já temos na base): ${excludeList.join(', ')}. Escolha outro artista relevante.`;
        }

        const schema = `{
  "nameRomanized": "string (nome romanizado, ex: 'Kim Taehyung')",
  "nameHangul": "string (nome em hangul, ex: '김태형')",
  "birthName": "string (nome real completo)",
  "stageNames": "string (nomes artísticos separados por vírgula, ex: 'V, TaeTae')",
  "birthDate": "string (data de nascimento no formato YYYY-MM-DD)",
  "roles": "string (papéis separados por vírgula, ex: 'CANTOR, ATOR, MODELO')",
  "bio": "string (biografia curta em português, 2-3 frases)",
  "primaryImageUrl": "string (URL de imagem do Unsplash relacionada a K-Pop/celebridade)",
  "agencyName": "string (nome da agência, ex: 'HYBE', 'SM Entertainment', 'YG Entertainment')",
  "height": "string (ex: '178 cm')",
  "bloodType": "string (ex: 'AB')",
  "zodiacSign": "string (ex: 'Capricórnio')"
}`;

        const result = await this.getOrchestrator().generateStructured<{
            nameRomanized: string;
            nameHangul: string;
            birthName?: string;
            stageNames: string;
            birthDate: string;
            roles: string;
            bio: string;
            primaryImageUrl: string;
            agencyName: string;
            height?: string;
            bloodType?: string;
            zodiacSign?: string;
        }>(prompt, schema, {
            ...options,
            systemPrompt: SYSTEM_PROMPTS.artist,
            preferredProvider: 'deepseek', // Usa DeepSeek como provider principal
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
            primaryImageUrl: imageResult?.url || result.primaryImageUrl,
            agencyName: result.agencyName,
        };
    }

    /**
     * Gera múltiplos artistas
     */
    async generateMultipleArtists(count: number, options?: GenerateOptions): Promise<ArtistData[]> {
        const artists: ArtistData[] = [];
        const excludeList = options?.excludeList || [];

        console.log(`🎤 Generating up to ${count} artists based on AI discovery...`);

        // 1. Descobrir nomes via AI
        const candidates = await this.discoverArtistNamesViaAI(excludeList);

        // 2. Tentar gerar cada um (TMDB primeiro)
        for (let i = 0; i < Math.min(count, candidates.length); i++) {
            try {
                console.log(`\n👤 Generating artist ${i + 1}/${count}...`);
                // Passamos a lista de candidatos para o generateArtist
                const artist = await this.generateArtist(options, candidates);
                artists.push(artist);
                console.log(`✅ Generated: ${artist.nameRomanized} (${artist.nameHangul})`);

                // Adicionar o novo artista ao excludeList para não sugerir de novo na mesma run
                excludeList.push(artist.nameRomanized);
            } catch (error: any) {
                console.error(`❌ Failed to generate artist ${i + 1}: ${error.message}`);
            }
        }

        return artists;
    }
}
