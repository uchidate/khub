/**
 * TMDB Discovery Service
 *
 * Descobre artistas coreanos populares e trending do TMDB
 * Estratégia: Dados 100% reais ao invés de gerados por AI
 *
 * Fontes:
 * - Popular Korean actors/actresses
 * - Trending people (Korea region)
 * - Cast from popular K-dramas/K-movies
 */

import { RateLimiter, RateLimiterPresets } from '../utils/rate-limiter';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

interface TMDBPerson {
  id: number;
  name: string;
  profile_path: string | null;
  known_for_department: string;
  popularity: number;
  known_for?: Array<{
    id: number;
    title?: string;
    name?: string;
    original_language: string;
  }>;
}

interface TMDBPersonDetails {
  id: number;
  name: string;
  also_known_as: string[];
  biography: string;
  birthday: string | null;
  place_of_birth: string | null;
  profile_path: string | null;
  known_for_department: string;
  popularity: number;
}

export interface DiscoveredArtist {
  tmdbId: number;
  name: string;
  koreanName?: string;
  biography: string;
  birthDate: Date | null;
  placeOfBirth: string | null;
  profileImage: string | null;
  department: string;
  popularity: number;
  isKorean: boolean;
}

/**
 * Service para descobrir artistas coreanos reais do TMDB
 */
export class TMDBDiscoveryService {
  private rateLimiter: RateLimiter;

  constructor() {
    if (!TMDB_API_KEY) {
      throw new Error('TMDB_API_KEY is not configured');
    }
    this.rateLimiter = new RateLimiter(RateLimiterPresets.TMDB);
  }

  /**
   * Descobre artistas coreanos populares
   * Combina múltiplas estratégias para obter diversidade
   */
  async discoverKoreanArtists(count: number = 10): Promise<DiscoveredArtist[]> {
    console.log(`🔍 Discovering ${count} Korean artists from TMDB...`);

    const discovered: DiscoveredArtist[] = [];
    const seenIds = new Set<number>();

    // Estratégia 1: Buscar "popular" people filtrado por Korean works
    const popularPeople = await this.getPopularPeopleWithKoreanWorks(count * 2);

    for (const person of popularPeople) {
      if (seenIds.has(person.id)) continue;
      seenIds.add(person.id);

      const details = await this.getPersonDetails(person.id);
      if (!details) continue;

      // Verificar se é artista coreano
      const isKorean = this.isKoreanArtist(details);
      if (!isKorean) continue;

      discovered.push(this.mapToDiscoveredArtist(details));

      if (discovered.length >= count) break;
    }

    // Estratégia 2: Se não temos suficientes, buscar do cast de K-dramas populares
    if (discovered.length < count) {
      const fromDramas = await this.getArtistsFromPopularKDramas(count - discovered.length);

      for (const artist of fromDramas) {
        if (!seenIds.has(artist.tmdbId)) {
          discovered.push(artist);
          seenIds.add(artist.tmdbId);
        }
      }
    }

    console.log(`✅ Discovered ${discovered.length} Korean artists`);
    return discovered.slice(0, count);
  }

  /**
   * Busca pessoas populares que trabalharam em produções coreanas
   * OTIMIZAÇÃO: Rotação de página baseada na hora para evitar sempre os mesmos artistas
   */
  private async getPopularPeopleWithKoreanWorks(count: number): Promise<TMDBPerson[]> {
    await this.rateLimiter.acquire();

    // Rotação de página baseada na hora (muda a cada hora)
    // 20 páginas = ~400 artistas diferentes ao longo do dia
    const page = (Math.floor(Date.now() / 3600000) % 20) + 1;

    console.log(`📄 Fetching from TMDB popular page ${page} (rotates hourly)`);

    const response = await fetch(
      `${TMDB_BASE_URL}/person/popular?api_key=${TMDB_API_KEY}&language=ko-KR&page=${page}`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }

    const data = await response.json();
    const people: TMDBPerson[] = data.results || [];

    // Filtrar apenas pessoas que trabalharam em produções coreanas
    const filtered = people.filter(person => {
      if (!person.known_for) return false;
      return person.known_for.some(work => work.original_language === 'ko');
    });

    // Randomizar ordem intra-página para mais variedade
    const shuffled = filtered.sort(() => Math.random() - 0.5);

    return shuffled.slice(0, count);
  }

  /**
   * Busca artistas do cast de K-dramas populares
   */
  private async getArtistsFromPopularKDramas(count: number): Promise<DiscoveredArtist[]> {
    // Primeiro, buscar K-dramas populares
    await this.rateLimiter.acquire();

    const response = await fetch(
      `${TMDB_BASE_URL}/discover/tv?api_key=${TMDB_API_KEY}&with_original_language=ko&sort_by=popularity.desc&page=1`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.warn(`Failed to fetch K-dramas: ${response.status}`);
      return [];
    }

    const data = await response.json();
    const shows = data.results || [];

    const artists: DiscoveredArtist[] = [];
    const seenIds = new Set<number>();

    // Pegar cast dos primeiros shows
    for (const show of shows.slice(0, 3)) {
      if (artists.length >= count) break;

      await this.rateLimiter.acquire();

      const castResponse = await fetch(
        `${TMDB_BASE_URL}/tv/${show.id}/credits?api_key=${TMDB_API_KEY}`,
        {
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      if (!castResponse.ok) continue;

      const castData = await castResponse.json();
      const cast = castData.cast || [];

      // Pegar primeiros atores/atrizes
      for (const member of cast.slice(0, 3)) {
        if (artists.length >= count) break;
        if (seenIds.has(member.id)) continue;

        const details = await this.getPersonDetails(member.id);
        if (!details) continue;

        const isKorean = this.isKoreanArtist(details);
        if (!isKorean) continue;

        seenIds.add(member.id);
        artists.push(this.mapToDiscoveredArtist(details));
      }
    }

    return artists;
  }

  /**
   * Busca detalhes completos de uma pessoa
   */
  private async getPersonDetails(personId: number): Promise<TMDBPersonDetails | null> {
    try {
      await this.rateLimiter.acquire();

      const response = await fetch(
        `${TMDB_BASE_URL}/person/${personId}?api_key=${TMDB_API_KEY}&language=ko-KR`,
        {
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        console.warn(`Failed to fetch person ${personId}: ${response.status}`);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error(`Error fetching person ${personId}:`, error);
      return null;
    }
  }

  /**
   * Verifica se é um artista coreano baseado nos dados
   */
  private isKoreanArtist(person: TMDBPersonDetails): boolean {
    // Verificar local de nascimento
    if (person.place_of_birth) {
      const birthPlace = person.place_of_birth.toLowerCase();
      if (
        birthPlace.includes('korea') ||
        birthPlace.includes('seoul') ||
        birthPlace.includes('busan') ||
        birthPlace.includes('incheon') ||
        birthPlace.includes('daegu')
      ) {
        return true;
      }
    }

    // Verificar nomes alternativos para nomes coreanos
    if (person.also_known_as && person.also_known_as.length > 0) {
      const hasKoreanName = person.also_known_as.some(name => {
        // Detectar caracteres coreanos (Hangul)
        return /[\uAC00-\uD7AF]/.test(name);
      });
      if (hasKoreanName) return true;
    }

    return false;
  }

  /**
   * Mapeia dados TMDB para DiscoveredArtist
   */
  private mapToDiscoveredArtist(person: TMDBPersonDetails): DiscoveredArtist {
    // Encontrar nome coreano nos aliases
    const koreanName = person.also_known_as?.find(name => /[\uAC00-\uD7AF]/.test(name));

    return {
      tmdbId: person.id,
      name: person.name,
      koreanName,
      biography: person.biography || '',
      birthDate: person.birthday ? new Date(person.birthday) : null,
      placeOfBirth: person.place_of_birth,
      profileImage: person.profile_path
        ? `${TMDB_IMAGE_BASE}${person.profile_path}`
        : null,
      department: person.known_for_department || 'Acting',
      popularity: person.popularity,
      isKorean: true,
    };
  }

  /**
   * Busca a foto de um artista existente pelo tmdbId
   * Útil para corrigir artistas sem foto no banco
   */
  async fetchPersonPhoto(tmdbId: number): Promise<string | null> {
    const details = await this.getPersonDetails(tmdbId);
    if (!details?.profile_path) return null;
    return `${TMDB_IMAGE_BASE}${details.profile_path}`;
  }

  /**
   * Busca um artista específico por nome
   */
  async searchArtist(name: string): Promise<DiscoveredArtist | null> {
    console.log(`🔍 Searching for artist: ${name}`);

    await this.rateLimiter.acquire();

    const response = await fetch(
      `${TMDB_BASE_URL}/search/person?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(name)}&language=ko-KR&page=1`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.warn(`Search failed: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const people: TMDBPerson[] = data.results || [];

    if (people.length === 0) {
      console.log(`❌ Artist not found: ${name}`);
      return null;
    }

    // Pegar o primeiro resultado
    const person = people[0];
    const details = await this.getPersonDetails(person.id);

    if (!details) return null;

    return this.mapToDiscoveredArtist(details);
  }
}

// Singleton
let instance: TMDBDiscoveryService | null = null;

export function getTMDBDiscoveryService(): TMDBDiscoveryService {
  if (!instance) {
    instance = new TMDBDiscoveryService();
  }
  return instance;
}
