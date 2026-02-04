/**
 * TMDB API Response Types
 * https://developers.themoviedb.org/3/
 */

export interface TMDBPerson {
  id: number
  name: string
  also_known_as: string[]
  biography: string
  birthday: string | null
  deathday: string | null
  gender: number // 0: Not set, 1: Female, 2: Male, 3: Non-binary
  homepage: string | null
  known_for_department: string
  place_of_birth: string | null
  popularity: number
  profile_path: string | null
}

export interface TMDBPersonSearchResult {
  page: number
  results: TMDBPerson[]
  total_pages: number
  total_results: number
}

export interface TMDBCast {
  adult: boolean
  cast_id: number
  character: string
  credit_id: string
  gender: number
  id: number
  known_for_department: string
  name: string
  order: number
  original_name: string
  popularity: number
  profile_path: string | null
}

export interface TMDBCrew {
  adult: boolean
  credit_id: string
  department: string
  gender: number
  id: number
  job: string
  known_for_department: string
  name: string
  original_name: string
  popularity: number
  profile_path: string | null
}

export interface TMDBMovieCredit {
  adult: boolean
  backdrop_path: string | null
  character?: string // For cast
  job?: string // For crew
  credit_id: string
  genre_ids: number[]
  id: number
  original_language: string
  original_title: string
  overview: string
  popularity: number
  poster_path: string | null
  release_date: string
  title: string
  video: boolean
  vote_average: number
  vote_count: number
}

export interface TMDBTVCredit {
  adult: boolean
  backdrop_path: string | null
  character?: string // For cast
  job?: string // For crew
  credit_id: string
  episode_count: number
  first_air_date: string
  genre_ids: number[]
  id: number
  name: string
  origin_country: string[]
  original_language: string
  original_name: string
  overview: string
  popularity: number
  poster_path: string | null
  vote_average: number
  vote_count: number
}

export interface TMDBPersonCredits {
  cast: (TMDBMovieCredit | TMDBTVCredit)[]
  crew: (TMDBMovieCredit | TMDBTVCredit)[]
  id: number
}

export interface TMDBPersonCombinedCredits {
  cast: Array<TMDBMovieCredit & { media_type: 'movie' } | TMDBTVCredit & { media_type: 'tv' }>
  crew: Array<TMDBMovieCredit & { media_type: 'movie' } | TMDBTVCredit & { media_type: 'tv' }>
  id: number
}

export interface TMDBMovie {
  adult: boolean
  backdrop_path: string | null
  belongs_to_collection: null | {
    id: number
    name: string
    poster_path: string | null
    backdrop_path: string | null
  }
  budget: number
  genres: Array<{ id: number; name: string }>
  homepage: string | null
  id: number
  imdb_id: string | null
  original_language: string
  original_title: string
  overview: string
  popularity: number
  poster_path: string | null
  production_companies: Array<{
    id: number
    logo_path: string | null
    name: string
    origin_country: string
  }>
  production_countries: Array<{
    iso_3166_1: string
    name: string
  }>
  release_date: string
  revenue: number
  runtime: number | null
  spoken_languages: Array<{
    english_name: string
    iso_639_1: string
    name: string
  }>
  status: string
  tagline: string | null
  title: string
  video: boolean
  vote_average: number
  vote_count: number
}

export interface TMDBTVShow {
  adult: boolean
  backdrop_path: string | null
  created_by: Array<{
    id: number
    credit_id: string
    name: string
    gender: number
    profile_path: string | null
  }>
  episode_run_time: number[]
  first_air_date: string
  genres: Array<{ id: number; name: string }>
  homepage: string
  id: number
  in_production: boolean
  languages: string[]
  last_air_date: string
  last_episode_to_air: {
    air_date: string
    episode_number: number
    id: number
    name: string
    overview: string
    production_code: string
    runtime: number
    season_number: number
    show_id: number
    still_path: string | null
    vote_average: number
    vote_count: number
  } | null
  name: string
  next_episode_to_air: null
  networks: Array<{
    id: number
    logo_path: string | null
    name: string
    origin_country: string
  }>
  number_of_episodes: number
  number_of_seasons: number
  origin_country: string[]
  original_language: string
  original_name: string
  overview: string
  popularity: number
  poster_path: string | null
  production_companies: Array<{
    id: number
    logo_path: string | null
    name: string
    origin_country: string
  }>
  production_countries: Array<{
    iso_3166_1: string
    name: string
  }>
  seasons: Array<{
    air_date: string | null
    episode_count: number
    id: number
    name: string
    overview: string
    poster_path: string | null
    season_number: number
  }>
  spoken_languages: Array<{
    english_name: string
    iso_639_1: string
    name: string
  }>
  status: string
  tagline: string
  type: string
  vote_average: number
  vote_count: number
}

export interface TMDBWatchProvider {
  display_priority: number
  logo_path: string
  provider_id: number
  provider_name: string
}

export interface TMDBWatchProviders {
  id: number
  results: {
    [countryCode: string]: {
      link: string
      flatrate?: TMDBWatchProvider[]
      rent?: TMDBWatchProvider[]
      buy?: TMDBWatchProvider[]
    }
  }
}

export interface TMDBTranslation {
  iso_3166_1: string
  iso_639_1: string
  name: string
  english_name: string
  data: {
    title?: string
    overview?: string
    homepage?: string
    name?: string // For TV shows
  }
}

export interface TMDBTranslations {
  id: number
  translations: TMDBTranslation[]
}

// Custom types for our application

export interface TMDBProductionData {
  tmdbId: number
  tmdbType: 'movie' | 'tv'
  title: string
  titleKr: string | null
  year: number | null
  synopsis: string | null
  imageUrl: string | null
  releaseDate: Date | null
  runtime: number | null
  voteAverage: number | null
  streamingPlatforms: string[]
  role: string | null // Character name or job (Director, Writer, etc.)
}

export interface RateLimitInfo {
  limit: number
  remaining: number
  reset: number
}
