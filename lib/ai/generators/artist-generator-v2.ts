import { PrismaClient } from '@prisma/client';
import { getTMDBDiscoveryService, DiscoveredArtist } from '../../services/tmdb-discovery-service';

export interface ArtistData {
    nameRomanized: string;
    nameHangul?: string;
    birthDate?: Date;
    roles: string[];
    bio: string;
    primaryImageUrl: string;
    tmdbId: number;
    placeOfBirth?: string;
}

/**
 * Artist Generator V2 - Dados 100% Reais (Discovery Only)
 *
 * ESTRATÉGIA SEPARADA (Performance):
 * 1. Busca artistas reais do TMDB (via TMDBDiscoveryService)
 * 2. Salva dados BRUTOS (sem tradução) com status 'pending'
 * 3. Tradução é feita POSTERIORMENTE por processo separado
 *
 * BENEFÍCIOS:
 * - Discovery RÁPIDO (sem esperar Ollama)
 * - Tradução batch otimizada em processo separado
 * - Melhor separação de responsabilidades
 * - Permite processar mais artistas por vez
 */
export class ArtistGeneratorV2 {
    private tmdbDiscovery = getTMDBDiscoveryService();
    private prisma: PrismaClient;

    constructor(prisma: PrismaClient) {
        this.prisma = prisma;
    }

    /**
     * Gera múltiplos artistas reais
     */
    async generateMultipleArtists(
        count: number,
        options: { excludeList?: string[] } = {}
    ): Promise<ArtistData[]> {
        console.log(`🎤 Generating ${count} real artists from TMDB...`);

        const artists: ArtistData[] = [];

        // Buscar artistas existentes no DB para evitar duplicatas
        const existingArtists = await this.prisma.artist.findMany({
            select: { tmdbId: true, nameRomanized: true }
        });

        const existingTmdbIds = new Set(
            existingArtists
                .filter(a => a.tmdbId)
                .map(a => parseInt(a.tmdbId as string))
        );

        // Normaliza nome para comparação fuzzy: remove parênteses, minúsculo, trim
        // Previne duplicatas como "IU" vs "IU (Lee Ji-eun)" ou "Jungkook" vs "Jung Kook"
        const normalizeForComparison = (name: string) =>
            name.toLowerCase().replace(/\s*\([^)]*\)\s*/g, '').replace(/[\s-.]/g, '').trim();

        const existingNamesNormalized = new Set(
            existingArtists.map(a => normalizeForComparison(a.nameRomanized))
        );

        const excludeSet = new Set(options.excludeList || []);
        existingArtists.forEach(a => excludeSet.add(a.nameRomanized));

        // OTIMIZAÇÃO: Buscar artistas tentados recentemente (últimos 7 dias)
        // Evita tentar os mesmos artistas repetidamente se já foram pulados
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const recentAttempts = await this.prisma.artistDiscoveryLog.findMany({
            where: {
                attemptedAt: { gte: sevenDaysAgo },
                wasAdded: false  // Apenas os que foram pulados (não adicionados)
            },
            select: { tmdbId: true }
        });

        const recentlyAttemptedIds = new Set(recentAttempts.map(a => a.tmdbId));

        console.log(`📊 Excluded: ${existingTmdbIds.size} in DB, ${recentlyAttemptedIds.size} recently attempted`);

        // Descobrir artistas do TMDB (buscar mais para ter margem)
        // Multiplicador aumentado de 3 para 5 devido ao filtro mais rigoroso em isRelevantToKoreanCulture
        const discovered = await this.tmdbDiscovery.discoverKoreanArtists(count * 5);

        console.log(`📊 Found ${discovered.length} Korean artists, filtering...`);

        for (const artist of discovered) {
            // Pular se já existe no DB por tmdbId (mais confiável)
            if (existingTmdbIds.has(artist.tmdbId)) {
                console.log(`  ⏭️  Skipping ${artist.name} (already in DB by tmdbId)`);
                // Registrar tentativa (wasAdded=false)
                await this.prisma.artistDiscoveryLog.create({
                    data: {
                        tmdbId: artist.tmdbId,
                        wasAdded: false,
                        source: 'popular'
                    }
                }).catch(() => {}); // Ignore errors (non-critical)
                continue;
            }

            // OTIMIZAÇÃO: Pular se foi tentado recentemente (últimos 7 dias)
            if (recentlyAttemptedIds.has(artist.tmdbId)) {
                console.log(`  ⏭️  Skipping ${artist.name} (attempted in last 7 days)`);
                continue;
            }

            // Pular se nome normalizado coincide (previne duplicatas por variação de nome)
            const normalizedName = normalizeForComparison(artist.name);
            if (existingNamesNormalized.has(normalizedName)) {
                console.log(`  ⏭️  Skipping ${artist.name} (fuzzy name match in DB)`);
                // Registrar tentativa
                await this.prisma.artistDiscoveryLog.create({
                    data: {
                        tmdbId: artist.tmdbId,
                        wasAdded: false,
                        source: 'popular'
                    }
                }).catch(() => {});
                continue;
            }

            // Pular se está na lista de exclusão exata
            if (excludeSet.has(artist.name)) {
                console.log(`  ⏭️  Skipping ${artist.name} (in exclude list)`);
                continue;
            }

            try {
                const artistData = await this.processDiscoveredArtist(artist);
                artists.push(artistData);
                console.log(`  ✅ Processed: ${artistData.nameRomanized}`);

                // Registrar artista adicionado com sucesso
                await this.prisma.artistDiscoveryLog.create({
                    data: {
                        tmdbId: artist.tmdbId,
                        wasAdded: true,
                        source: 'popular'
                    }
                }).catch(() => {}); // Non-critical

                if (artists.length >= count) break;
            } catch (error: any) {
                console.error(`  ❌ Failed to process ${artist.name}: ${error.message}`);
                // Registrar falha ao processar
                await this.prisma.artistDiscoveryLog.create({
                    data: {
                        tmdbId: artist.tmdbId,
                        wasAdded: false,
                        source: 'popular'
                    }
                }).catch(() => {});
                continue;
            }
        }

        console.log(`✅ Generated ${artists.length} artists`);
        return artists;
    }

    /**
     * Processa um artista descoberto do TMDB
     * NOTA: Salva dados BRUTOS sem tradução (status='pending')
     * Tradução será feita posteriormente por processo separado
     */
    private async processDiscoveredArtist(discovered: DiscoveredArtist): Promise<ArtistData> {
        // Determinar roles baseado no department
        const roles = this.mapDepartmentToRoles(discovered.department);

        // Criar bio básica se não houver (original do TMDB)
        let bio = discovered.biography;
        if (!bio || bio.trim().length === 0) {
            const rolesPT = this.getDepartmentNamePT(discovered.department);
            bio = `${discovered.name} é ${rolesPT} conhecido(a) na indústria do entretenimento coreano.`;
        }

        return {
            nameRomanized: discovered.name,
            nameHangul: discovered.koreanName,
            birthDate: discovered.birthDate || undefined,
            roles,
            bio, // Biografia ORIGINAL (EN/KR) - será traduzida depois
            primaryImageUrl: discovered.profileImage || '',
            tmdbId: discovered.tmdbId,
            placeOfBirth: discovered.placeOfBirth || undefined,
        };
    }


    /**
     * Mapeia department do TMDB para roles do nosso sistema
     */
    private mapDepartmentToRoles(department: string): string[] {
        const dept = department.toLowerCase();

        if (dept.includes('acting')) {
            return ['ATOR', 'ARTISTA'];
        }

        if (dept.includes('music') || dept.includes('singing')) {
            return ['CANTOR', 'ARTISTA'];
        }

        if (dept.includes('directing')) {
            return ['ARTISTA'];
        }

        if (dept.includes('writing')) {
            return ['ARTISTA'];
        }

        // Padrão: assumir ator (mais comum)
        return ['ATOR', 'ARTISTA'];
    }

    /**
     * Nome do department em português
     */
    private getDepartmentNamePT(department: string): string {
        const dept = department.toLowerCase();

        if (dept.includes('acting')) return 'um(a) ator/atriz';
        if (dept.includes('music')) return 'um(a) cantor(a)';
        if (dept.includes('directing')) return 'um(a) diretor(a)';
        if (dept.includes('writing')) return 'um(a) roteirista';

        return 'um(a) artista';
    }

    /**
     * Busca um artista específico por nome
     */
    async searchAndProcessArtist(name: string): Promise<ArtistData | null> {
        console.log(`🔍 Searching for specific artist: ${name}`);

        const discovered = await this.tmdbDiscovery.searchArtist(name);

        if (!discovered) {
            console.log(`❌ Artist not found: ${name}`);
            return null;
        }

        return this.processDiscoveredArtist(discovered);
    }
}
