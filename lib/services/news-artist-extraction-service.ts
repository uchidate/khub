import { PrismaClient } from '@prisma/client';

export interface ArtistMention {
    artistId: string;
    name: string;
    confidence: number; // 0.0 - 1.0
}

/**
 * Serviço de extração de artistas mencionados em notícias (NER)
 *
 * ESTRATÉGIA:
 * 1. Exact matching (95% dos casos, sem custo de AI):
 *    - Busca nomes de artistas do DB diretamente no texto
 *    - Cache em memória para evitar queries repetidas
 *    - Case-insensitive, normalização de espaços
 *
 * 2. Sem AI fallback por enquanto:
 *    - Exact matching é confiável e rápido
 *    - AI pode sugerir nomes errados (false positives)
 *    - Pode ser adicionado no futuro se necessário
 */
export class NewsArtistExtractionService {
    private prisma: PrismaClient;

    // Cache: nome normalizado → artistId
    private nameCache: Map<string, string> = new Map();
    private cacheLoadedAt: Date | null = null;
    private readonly CACHE_TTL_MS = 60 * 60 * 1000; // 1 hora

    constructor(prisma: PrismaClient) {
        this.prisma = prisma;
    }

    /**
     * Extrai artistas mencionados no título e conteúdo de uma notícia
     */
    async extractArtists(title: string, content: string): Promise<ArtistMention[]> {
        await this.refreshCacheIfStale();

        const text = `${title} ${content}`;
        const mentions = this.findExactMatches(text);

        if (mentions.length > 0) {
            console.log(`  🎤 Found ${mentions.length} artist(s): ${mentions.map(m => m.name).join(', ')}`);
        }

        return mentions;
    }

    /**
     * Carrega/atualiza cache de nomes de artistas do banco
     */
    private async refreshCacheIfStale(): Promise<void> {
        const now = new Date();
        const isStale = !this.cacheLoadedAt ||
            (now.getTime() - this.cacheLoadedAt.getTime()) > this.CACHE_TTL_MS;

        if (!isStale) return;

        const artists = await this.prisma.artist.findMany({
            select: {
                id: true,
                nameRomanized: true,
                stageNames: true,
            }
        });

        this.nameCache.clear();

        for (const artist of artists) {
            // Indexar nome romanizado
            this.nameCache.set(this.normalize(artist.nameRomanized), artist.id);

            // Indexar stage names
            for (const stageName of artist.stageNames) {
                if (stageName.trim().length >= 2) {
                    this.nameCache.set(this.normalize(stageName), artist.id);
                }
            }
        }

        this.cacheLoadedAt = now;
        console.log(`  📚 Artist cache refreshed: ${artists.length} artists, ${this.nameCache.size} name variants`);
    }

    /**
     * Busca exact matches de nomes de artistas no texto
     * Usa word boundary matching para evitar falsos positivos
     */
    private findExactMatches(text: string): ArtistMention[] {
        const foundArtistIds = new Set<string>();
        const mentions: ArtistMention[] = [];

        // Ordenar por tamanho descendente (nomes mais longos primeiro)
        // Isso evita que "IU" seja encontrado dentro de "IU celebra"
        // antes de buscar o nome completo
        const sortedEntries = Array.from(this.nameCache.entries())
            .sort((a, b) => b[0].length - a[0].length);

        const normalizedText = this.normalize(text);

        for (const [normalizedName, artistId] of sortedEntries) {
            // Pular nomes muito curtos (menos de 2 chars) - muitos falsos positivos
            if (normalizedName.length < 2) continue;

            // Já encontrou este artista
            if (foundArtistIds.has(artistId)) continue;

            // Buscar com separadores de palavras (espaço, pontuação, início/fim)
            const escaped = normalizedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const pattern = new RegExp(`(?:^|[^a-z0-9])${escaped}(?:[^a-z0-9]|$)`, 'i');

            if (pattern.test(normalizedText)) {
                foundArtistIds.add(artistId);

                // Buscar nome original para exibição
                const displayName = this.getDisplayName(normalizedName);
                mentions.push({
                    artistId,
                    name: displayName,
                    confidence: 0.95, // Exact match tem alta confiança
                });
            }
        }

        return mentions;
    }

    /**
     * Normaliza texto para comparação (lowercase, espaços simples)
     */
    private normalize(text: string): string {
        return text
            .toLowerCase()
            .replace(/\s+/g, ' ')
            .trim();
    }

    /**
     * Busca nome original (não normalizado) para um nome normalizado
     * Usa o cache reverso implícito via nameRomanized
     */
    private getDisplayName(normalizedName: string): string {
        // Capitalizar primeira letra de cada palavra
        return normalizedName
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    /**
     * Força refresh do cache (útil após adicionar novos artistas)
     */
    invalidateCache(): void {
        this.cacheLoadedAt = null;
    }
}

// Singleton por instância de PrismaClient
let instance: NewsArtistExtractionService | null = null;

export function getNewsArtistExtractionService(prisma?: PrismaClient): NewsArtistExtractionService {
    if (!instance || prisma) {
        const { PrismaClient: PC } = require('@prisma/client');
        instance = new NewsArtistExtractionService(prisma || new PC());
    }
    return instance;
}
