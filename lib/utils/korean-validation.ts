/**
 * Utilitário para validar relevância à cultura coreana
 *
 * Determina se um artista/pessoa é relevante para a cultura coreana
 * baseado em dados do TMDB (local de nascimento, nomes, biografia).
 */

interface PersonForValidation {
  place_of_birth?: string | null
  biography?: string
  popularity?: number
  also_known_as?: string[]
}

/**
 * Verifica se uma pessoa é relevante à cultura coreana.
 *
 * Critérios:
 * - Nascido na Coreia
 * - Tem nome em Hangul
 * - Biografia menciona K-pop, K-drama, trabalhos coreanos
 *
 * DEFAULT: Rejeitar (return false) - requer evidência positiva de relevância
 *
 * @param person - Dados da pessoa (TMDB ou similar)
 * @returns true se relevante à cultura coreana, false caso contrário
 */
export function isRelevantToKoreanCulture(person: PersonForValidation): boolean {
  const birthPlace = person.place_of_birth?.toLowerCase() || ''
  const bio = person.biography?.toLowerCase() || ''
  const popularity = person.popularity || 0

  // Filtro 1: Popularidade mínima (evitar desconhecidos)
  // Exceção: Se claramente coreano (nascimento ou nome), aceitar mesmo com baixa popularidade
  if (popularity < 5) {
    const isBornInKorea = birthPlace.includes('korea') ||
                          birthPlace.includes('seoul') ||
                          birthPlace.includes('busan')
    const hasKoreanName = person.also_known_as?.some(n => /[\uAC00-\uD7AF]/.test(n))
    return isBornInKorea || !!hasKoreanName
  }

  // Filtro 2: Nascido na Coreia? → FORTE indicador
  const isBornInKorea =
    birthPlace.includes('korea') ||
    birthPlace.includes('seoul') ||
    birthPlace.includes('busan') ||
    birthPlace.includes('incheon') ||
    birthPlace.includes('daegu') ||
    birthPlace.includes('gwangju') ||
    birthPlace.includes('daejeon') ||
    birthPlace.includes('ulsan') ||
    birthPlace.includes('suwon') ||
    birthPlace.includes('goyang') ||
    birthPlace.includes('yongin')

  if (isBornInKorea) return true

  // Filtro 3: Tem nome Hangul? → FORTE indicador
  const hasKoreanName = person.also_known_as?.some(name => {
    return /[\uAC00-\uD7AF]/.test(name)  // Unicode range for Hangul
  })
  if (hasKoreanName) return true

  // Filtro 4: Biografia menciona trabalhos coreanos? → FORTE indicador
  const hasStrongKoreanCultureMention =
    bio.includes('k-pop') ||
    bio.includes('kpop') ||
    bio.includes('k-drama') ||
    bio.includes('korean drama') ||
    bio.includes('korean idol') ||
    bio.includes('korean film') ||
    bio.includes('korean cinema') ||
    bio.includes('korean group') ||
    bio.includes('korean band') ||
    bio.includes('korean entertainment') ||
    bio.includes('korean actor') ||
    bio.includes('korean actress') ||
    bio.includes('korean singer')

  if (hasStrongKoreanCultureMention) return true

  // Filtro 5: De país conflitante? → Requer menção EXPLÍCITA de trabalho coreano
  const isFromConflictingCountry =
    (birthPlace.includes('china') && !birthPlace.includes('korea')) ||
    (birthPlace.includes('japan') && !birthPlace.includes('korea')) ||
    (birthPlace.includes('thailand') ||
     birthPlace.includes('vietnam') ||
     birthPlace.includes('philippines') ||
     birthPlace.includes('india') ||
     birthPlace.includes('indonesia') ||
     birthPlace.includes('malaysia')) &&
    !bio.includes('korean')

  if (isFromConflictingCountry) {
    // Apenas aceitar se menção EXPLÍCITA de trabalho na indústria coreana
    return bio.includes('k-drama') ||
           bio.includes('k-pop') ||
           bio.includes('korean film') ||
           bio.includes('korean group')
  }

  // Filtro 6: DEFAULT → REJEITAR
  // Mudança de filosofia: requer evidência positiva de relevância coreana
  // Melhor falso negativo (pode ser adicionado depois) que falso positivo (poluir BD)
  return false
}
