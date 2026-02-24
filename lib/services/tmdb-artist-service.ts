import { PrismaClient } from '@prisma/client';
import prisma from '../prisma';
import { RateLimiter, RateLimiterPresets } from '../utils/rate-limiter';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

const KOREAN_REGEX = /[\uAC00-\uD7AF\u3131-\u314E\u314F-\u3163]/
const CJK_REGEX = /[\uAC00-\uD7AF\u3131-\u314E\u4E00-\u9FFF\u3040-\u30FF]/

interface TMDBPerson {
  id: number;
  name: string;
  profile_path: string | null;
  known_for_department: string;
  popularity: number;
  known_for?: any[];
}

interface TMDBPersonDetails {
  id: number;
  name: string;
  profile_path: string | null;
  birthday: string | null;
  place_of_birth: string | null;
  biography: string;
  known_for_department: string;
  popularity: number;
  also_known_as?: string[];
}

interface RealArtistData {
  tmdbId: number;
  nameRomanized: string;
  nameHangul?: string;
  stageNames?: string[];
  birthName?: string;
  birthDate?: Date;
  profileImageUrl: string;
  biography?: string;
  roles: string[];
  popularity: number;
  height?: string;
  bloodType?: string;
  zodiacSign?: string;
}

/**
 * Service para buscar artistas REAIS do TMDB
 * Foca em artistas coreanos (K-pop/K-drama)
 */
export class TMDBArtistService {
  private prisma: PrismaClient;
  private rateLimiter: RateLimiter;

  constructor(prismaInstance?: PrismaClient) {
    this.prisma = prismaInstance || prisma;
    this.rateLimiter = new RateLimiter(RateLimiterPresets.TMDB);
  }

  /**
   * Obter estatísticas de rate limiting
   */
  getRateLimitStats(): { requestsInWindow: number; maxAllowed: number; percentUsed: number } {
    const stats = this.rateLimiter.getStats();
    return {
      requestsInWindow: stats.requestsInWindow,
      maxAllowed: stats.maxAllowed,
      percentUsed: Math.round(stats.percentUsed),
    };
  }

  /**
   * Busca artista específico no TMDB
   */
  async searchPerson(name: string): Promise<TMDBPerson | null> {
    if (!TMDB_API_KEY) {
      throw new Error('TMDB_API_KEY not configured');
    }

    // Aguardar se necessário para respeitar rate limit
    await this.rateLimiter.acquire();

    try {
      const response = await fetch(
        `${TMDB_BASE_URL}/search/person?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(name)}&language=pt-BR&include_adult=false`
      );

      if (!response.ok) {
        // Check for rate limit error
        if (response.status === 429) {
          console.error(`❌ TMDB rate limit exceeded! Aguardando 10s...`);
          await new Promise(resolve => setTimeout(resolve, 10000));
          return null;
        }
        console.error(`❌ TMDB API error: ${response.status}`);
        return null;
      }

      const data = await response.json();

      if (data.results && data.results.length > 0) {
        // Retorna o primeiro resultado (geralmente o mais relevante)
        return data.results[0];
      }

      return null;
    } catch (error: any) {
      console.error(`❌ Error searching TMDB: ${error.message}`);
      return null;
    }
  }

  /**
   * Busca detalhes completos de uma pessoa no TMDB
   */
  async getPersonDetails(tmdbId: number): Promise<TMDBPersonDetails | null> {
    if (!TMDB_API_KEY) {
      throw new Error('TMDB_API_KEY not configured');
    }

    // Aguardar se necessário para respeitar rate limit
    await this.rateLimiter.acquire();

    try {
      const response = await fetch(
        `${TMDB_BASE_URL}/person/${tmdbId}?api_key=${TMDB_API_KEY}&language=pt-BR`
      );

      if (!response.ok) {
        // Check for rate limit error
        if (response.status === 429) {
          console.error(`❌ TMDB rate limit exceeded! Aguardando 10s...`);
          await new Promise(resolve => setTimeout(resolve, 10000));
          return null;
        }
        console.error(`❌ TMDB API error: ${response.status}`);
        return null;
      }

      return await response.json();
    } catch (error: any) {
      console.error(`❌ Error fetching TMDB details: ${error.message}`);
      return null;
    }
  }

  /**
   * Fetch person name in English (used when pt-BR returns Korean name as primary).
   */
  private async fetchPersonNameEn(tmdbId: number): Promise<string | null> {
    if (!TMDB_API_KEY) return null
    try {
      const res = await fetch(
        `${TMDB_BASE_URL}/person/${tmdbId}?api_key=${TMDB_API_KEY}&language=en-US`,
        { signal: AbortSignal.timeout(8000) }
      )
      if (!res.ok) return null
      const data = await res.json()
      const name: string = data.name || ''
      // Only use if it's truly romanized (no Korean chars)
      return KOREAN_REGEX.test(name) ? null : name || null
    } catch {
      return null
    }
  }

  private async convertTMDBToArtistData(person: TMDBPerson, details?: TMDBPersonDetails): Promise<RealArtistData | null> {
    const fullDetails = details || await this.getPersonDetails(person.id);

    if (!fullDetails) {
      return null;
    }

    // Determinar roles baseado em known_for_department
    const roles: string[] = [];
    if (fullDetails.known_for_department === 'Acting') {
      roles.push('ATOR');
    }

    // Adicionar CANTOR se aparecer em música/K-pop
    const bio = fullDetails.biography?.toLowerCase() || '';
    if (bio.includes('singer') || bio.includes('k-pop') || bio.includes('idol') || bio.includes('cantor')) {
      roles.push('CANTOR');
    }

    if (bio.includes('model') || bio.includes('modelo')) {
      roles.push('MODELO');
    }

    // Se não tiver roles, assumir ator
    if (roles.length === 0) {
      roles.push('ATOR');
    }

    // Extrair nameHangul e stageNames do also_known_as
    let nameHangul: string | undefined = undefined;
    const stageNames: string[] = [];

    if (fullDetails.also_known_as && fullDetails.also_known_as.length > 0) {
      for (const aka of fullDetails.also_known_as) {
        if (KOREAN_REGEX.test(aka)) {
          // Nome coreano → nameHangul (pegar o primeiro encontrado)
          if (!nameHangul) nameHangul = aka;
        } else if (!CJK_REGEX.test(aka) && aka !== fullDetails.name) {
          // Nome romanizado diferente do nome principal → stage name
          const trimmed = aka.trim();
          if (trimmed.length >= 2 && trimmed.length <= 50 && !stageNames.includes(trimmed)) {
            stageNames.push(trimmed);
          }
        }
      }
    }

    // Corrigir nomes: se TMDB retornou o nome em coreano como nome principal,
    // buscar o nome romanizado correto em en-US e mover o coreano para nameHangul.
    let finalNameRomanized = fullDetails.name;
    if (KOREAN_REGEX.test(fullDetails.name)) {
      const enName = await this.fetchPersonNameEn(fullDetails.id);
      if (enName) {
        if (!nameHangul) nameHangul = fullDetails.name; // move coreano → hangul
        finalNameRomanized = enName;
      }
    }

    return {
      tmdbId: fullDetails.id,
      nameRomanized: finalNameRomanized,
      nameHangul: nameHangul,
      stageNames: stageNames.length > 0 ? stageNames : undefined,
      birthDate: fullDetails.birthday ? new Date(fullDetails.birthday) : undefined,
      profileImageUrl: fullDetails.profile_path
        ? `${TMDB_IMAGE_BASE}${fullDetails.profile_path}`
        : 'https://via.placeholder.com/500x750?text=No+Image',
      biography: fullDetails.biography || undefined,
      roles,
      popularity: fullDetails.popularity,
      // Wiki fields initialized as undefined, enriched later
      birthName: undefined,
      height: undefined,
      bloodType: undefined,
      zodiacSign: undefined,
    };
  }

  /**
   * Verifica se artista já existe no banco
   */
  async checkDuplicate(name: string, tmdbId?: number, nameHangul?: string): Promise<boolean> {
    const filters: any[] = [
      { nameRomanized: { equals: name, mode: 'insensitive' } }
    ];

    if (tmdbId) {
      filters.push({ tmdbId: String(tmdbId) });
    }

    if (nameHangul) {
      filters.push({ nameHangul: { equals: nameHangul } });
    }

    const existing = await this.prisma.artist.findFirst({
      where: {
        OR: filters
      },
    });

    return !!existing;
  }

  /**
   * Busca um artista real aleatório que ainda não está no banco
   * @param candidates Lista de nomes sugeridos para busca (ex: via AI)
   * @param excludeList Lista de nomes já no banco para evitar
   * @returns Dados do artista real ou null se não encontrar
   */
  async findRandomRealArtist(candidates: string[] = [], excludeList: string[] = []): Promise<RealArtistData | null> {
    if (candidates.length === 0) {
      console.warn('⚠️ No candidates provided for TMDB search');
      return null;
    }

    // Filtrar nomes já excluídos
    const availableNames = candidates.filter(
      name => !excludeList.some(excluded =>
        excluded.toLowerCase().includes(name.toLowerCase()) ||
        name.toLowerCase().includes(excluded.toLowerCase())
      )
    );

    if (availableNames.length === 0) {
      console.warn('⚠️ All provided candidates are already in database');
      return null;
    }

    // Embaralhar e tentar até 3 artistas
    const shuffled = availableNames.sort(() => Math.random() - 0.5);

    for (let i = 0; i < Math.min(3, shuffled.length); i++) {
      const name = shuffled[i];
      console.log(`🔍 Searching TMDB for: ${name}`);

      // Buscar no TMDB
      const person = await this.searchPerson(name);

      if (!person) {
        console.log(`   ⚠️  Not found in TMDB`);
        continue;
      }

      // Converter para formato do banco (para pegar o nome em hangul se disponível)
      const artistData = await this.convertTMDBToArtistData(person);

      if (!artistData) continue;

      // Verificar duplicata de forma mais robusta
      const isDuplicate = await this.checkDuplicate(
        artistData.nameRomanized,
        artistData.tmdbId,
        artistData.nameHangul
      );

      if (isDuplicate) {
        console.log(`   ⚠️  Already exists in database: ${artistData.nameRomanized} (${artistData.nameHangul || ''})`);
        continue;
      }

      if (artistData) {
        console.log(`   ✅ Found real artist: ${artistData.nameRomanized} (TMDB ID: ${artistData.tmdbId})`);
        return artistData;
      }
    }

    console.warn('⚠️  Could not find available real artist after 3 attempts');
    return null;
  }

  /**
   * Busca múltiplos artistas reais
   */
  async findMultipleRealArtists(count: number, candidates: string[] = [], excludeList: string[] = []): Promise<RealArtistData[]> {
    const artists: RealArtistData[] = [];
    const currentExcludeList = [...excludeList];
    const currentCandidates = [...candidates];

    console.log(`🎤 Finding up to ${count} real artists from TMDB using ${candidates.length} candidates...`);
    const stats = this.getRateLimitStats();
    console.log(`📊 Rate limit: ${stats.requestsInWindow}/${stats.maxAllowed} requests (${stats.percentUsed}% usado)`);

    for (let i = 0; i < count; i++) {
      const artist = await this.findRandomRealArtist(currentCandidates, currentExcludeList);

      if (artist) {
        artists.push(artist);
        currentExcludeList.push(artist.nameRomanized);
        // Remover o candidato já usado para não repetir
        const index = currentCandidates.indexOf(artist.nameRomanized);
        if (index > -1) currentCandidates.splice(index, 1);

        // Mostrar estatísticas de rate limiting
        const stats = this.getRateLimitStats();
        console.log(`   📈 Rate limit: ${stats.requestsInWindow}/${stats.maxAllowed} requests (${stats.percentUsed}%)`);
      } else {
        console.warn(`⚠️  Could not find more artists (${i}/${count} found)`);
        break;
      }
    }

    // Estatísticas finais
    const finalStats = this.getRateLimitStats();
    console.log(`\n✅ TMDB requests completed: ${finalStats.requestsInWindow} total requests`);
    console.log(`   📊 Usage: ${finalStats.percentUsed}% of safe limit (${finalStats.maxAllowed}/40 allowed)`);

    return artists;
  }

  /**
   * Busca artista por nome específico (para testes)
   */
  async findArtistByName(name: string): Promise<RealArtistData | null> {
    console.log(`🔍 Searching TMDB for: ${name}`);

    const person = await this.searchPerson(name);

    if (!person) {
      console.log(`   ❌ Not found in TMDB`);
      return null;
    }

    return await this.convertTMDBToArtistData(person);
  }
}

export function getTMDBArtistService(prisma?: PrismaClient): TMDBArtistService {
  return new TMDBArtistService(prisma);
}
