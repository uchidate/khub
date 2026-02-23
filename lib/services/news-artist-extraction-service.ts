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
 * 2. Grupo → Todos os membros via MusicalGroup (fonte autoritativa):
 *    - Quando "BLACKPINK" é mencionado, retorna TODOS os 4 membros
 *    - Não depende de cada artista ter o grupo em stageNames
 *
 * 3. nameHangul indexado:
 *    - Artistas e grupos com nome em Hangul são encontrados em notícias coreanas
 *
 * 4. Sem AI fallback por enquanto:
 *    - Exact matching é confiável e rápido
 *    - AI pode sugerir nomes errados (false positives)
 */
export class NewsArtistExtractionService {
    private prisma: PrismaClient;

    // Cache: nome normalizado → array de artistIds (suporta múltiplos artistas com mesmo nome/grupo)
    private nameCache: Map<string, string[]> = new Map();
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
     * Carrega/atualiza cache de nomes de artistas e grupos do banco.
     *
     * Para artistas individuais: indexa nameRomanized, nameHangul e stageNames.
     * Para grupos musicais: indexa name e nameHangul apontando para TODOS os membros
     * via ArtistGroupMembership — fonte autoritativa, independente de stageNames.
     */
    private async refreshCacheIfStale(): Promise<void> {
        const now = new Date();
        const isStale = !this.cacheLoadedAt ||
            (now.getTime() - this.cacheLoadedAt.getTime()) > this.CACHE_TTL_MS;

        if (!isStale) return;

        // ── Artistas individuais ──────────────────────────────────────
        const artists = await this.prisma.artist.findMany({
            select: {
                id: true,
                nameRomanized: true,
                nameHangul: true,
                stageNames: true,
            }
        });

        this.nameCache.clear();

        for (const artist of artists) {
            // Nome romanizado (ex: "Jennie", "Lisa")
            this.addToCache(artist.nameRomanized, artist.id);

            // Nome em Hangul (ex: "제니", "리사") — para notícias em coreano
            if (artist.nameHangul) {
                this.addToCache(artist.nameHangul, artist.id);
            }

            // Stage names individuais (ex: "RM", "V", "Suga")
            for (const stageName of artist.stageNames) {
                if (stageName.trim().length >= 2) {
                    this.addToCache(stageName, artist.id);
                }
            }
        }

        // ── Grupos musicais → todos os membros (fonte autoritativa) ──
        // Resolve o problema: "BLACKPINK" mencionado → retorna os 4 membros,
        // não apenas os que têm "BLACKPINK" em seus stageNames individualmente.
        const groups = await this.prisma.musicalGroup.findMany({
            select: {
                name: true,
                nameHangul: true,
                members: {
                    select: { artistId: true }
                },
            }
        });

        for (const group of groups) {
            const memberIds = group.members.map(m => m.artistId);
            if (memberIds.length === 0) continue;

            // Nome romanizado do grupo (ex: "BLACKPINK", "BTS", "aespa")
            this.addManyToCache(group.name, memberIds);

            // Nome em Hangul do grupo (ex: "블랙핑크", "방탄소년단")
            if (group.nameHangul) {
                this.addManyToCache(group.nameHangul, memberIds);
            }
        }

        this.cacheLoadedAt = now;
        const totalVariants = Array.from(this.nameCache.values()).reduce((sum, ids) => sum + ids.length, 0);
        console.log(`  📚 Artist cache refreshed: ${artists.length} artists, ${groups.length} groups, ${this.nameCache.size} name variants (${totalVariants} total associations)`);
    }

    /**
     * Adiciona um único artistId ao cache para um nome.
     */
    private addToCache(name: string, artistId: string): void {
        const key = this.normalize(name);
        if (key.length < 2) return;
        const existing = this.nameCache.get(key) || [];
        if (!existing.includes(artistId)) {
            this.nameCache.set(key, [...existing, artistId]);
        }
    }

    /**
     * Adiciona múltiplos artistIds ao cache para um nome (usado para grupos).
     * Faz merge com IDs já existentes sem duplicar.
     */
    private addManyToCache(name: string, artistIds: string[]): void {
        const key = this.normalize(name);
        if (key.length < 2) return;
        const existing = this.nameCache.get(key) || [];
        const seen = new Set(existing);
        const merged = [...existing];
        for (const id of artistIds) {
            if (!seen.has(id)) { seen.add(id); merged.push(id); }
        }
        this.nameCache.set(key, merged);
    }

    /**
     * Busca exact matches de nomes de artistas no texto.
     * Usa word boundary matching para evitar falsos positivos.
     * Retorna TODOS os artistas que compartilham um nome/grupo (ex: todos os membros do BTS).
     */
    private findExactMatches(text: string): ArtistMention[] {
        const foundArtistIds = new Set<string>();
        const mentions: ArtistMention[] = [];

        // Ordenar por tamanho descendente (nomes mais longos primeiro)
        // Evita que "IU" faça match antes de "IU celebra" verificar o nome completo
        const sortedEntries = Array.from(this.nameCache.entries())
            .sort((a, b) => b[0].length - a[0].length);

        const normalizedText = this.normalize(text);

        for (const [normalizedName, artistIds] of sortedEntries) {
            if (normalizedName.length < 2) continue;

            // Word boundary: nome deve ser precedido/seguido por separador (não letra/número)
            const escaped = normalizedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const pattern = new RegExp(`(?:^|[^a-z0-9])${escaped}(?:[^a-z0-9]|$)`, 'i');

            if (pattern.test(normalizedText)) {
                for (const artistId of artistIds) {
                    if (foundArtistIds.has(artistId)) continue;
                    foundArtistIds.add(artistId);

                    const displayName = this.getDisplayName(normalizedName);
                    mentions.push({
                        artistId,
                        name: displayName,
                        confidence: 0.95,
                    });
                }
            }
        }

        return mentions;
    }

    /**
     * Normaliza texto para comparação (lowercase, espaços simples).
     * Hangul não é afetado por toLowerCase, mas outros processos se beneficiam.
     */
    private normalize(text: string): string {
        return text
            .toLowerCase()
            .replace(/\s+/g, ' ')
            .trim();
    }

    /**
     * Capitaliza primeira letra de cada palavra (para nomes romanizados).
     * Para Hangul, retorna sem alteração.
     */
    private getDisplayName(normalizedName: string): string {
        return normalizedName
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    /**
     * Força refresh do cache (útil após adicionar novos artistas/grupos)
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
