/**
 * Role Labels — Gender-aware role display
 *
 * Translates internal role codes to display labels.
 * Gender: 0=unspecified, 1=female, 2=male, 3=non-binary (TMDB convention)
 */

const FEMALE_ROLE_MAP: Record<string, string> = {
  ATOR:          'ATRIZ',
  CANTOR:        'CANTORA',
  MODELO:        'MODELO',
  DANÇARINO:     'DANÇARINA',
  COMPOSITOR:    'COMPOSITORA',
  PRODUTOR:      'PRODUTORA',
  APRESENTADOR:  'APRESENTADORA',
  ESCRITOR:      'ESCRITORA',
  DIRETOR:       'DIRETORA',
  ROTEIRISTA:    'ROTEIRISTA',
  ARTISTA:       'ARTISTA',
  IDOL:          'IDOL',
  RAPPER:        'RAPPER',
  VOCALIST:      'VOCALIST',
}

// Forma base (masculina/neutra) ← forma feminina — usado para normalizar antes de regenerar
const BASE_ROLE_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(FEMALE_ROLE_MAP)
    .filter(([base, female]) => base !== female)
    .map(([base, female]) => [female, base])
)

function toBaseRole(role: string): string {
  const upper = role.toUpperCase()
  return BASE_ROLE_MAP[upper] ?? upper
}

/**
 * Tenta inferir o gênero a partir das próprias roles, quando o campo
 * `gender` do artista está ausente/inconsistente. Caso alguma role já
 * esteja na forma feminina (ex: "CANTORA"), assume gender=1.
 */
function inferGenderFromRoles(roles: string[]): number | null {
  for (const role of roles) {
    const upper = role.toUpperCase()
    if (BASE_ROLE_MAP[upper]) return 1
  }
  return null
}

/**
 * Returns the display label for a role, taking gender into account.
 * Female artists (gender=1) get feminine forms (ATOR→ATRIZ, CANTOR→CANTORA).
 */
export function getRoleLabel(role: string, gender?: number | null): string {
  const base = toBaseRole(role)
  if (gender === 1) {
    return FEMALE_ROLE_MAP[base] ?? base
  }
  return base
}

/**
 * Returns display labels for all roles of an artist.
 *
 * Robusto contra dados inconsistentes: se `gender` não estiver definido
 * (null/undefined/0), tenta inferir a partir das próprias roles — assim
 * artistas mulheres com roles parcialmente gendered (ex: ["ATOR", "CANTORA"])
 * são normalizadas de forma consistente (["ATRIZ", "CANTORA"]) em vez de
 * exibir uma mistura de formas masculina e feminina.
 */
export function getRoleLabels(roles: string[], gender?: number | null): string[] {
  const effectiveGender = gender || inferGenderFromRoles(roles)
  return roles.map(r => getRoleLabel(r, effectiveGender))
}
