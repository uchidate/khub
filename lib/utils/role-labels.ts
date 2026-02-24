/**
 * Role Labels — Gender-aware role display
 *
 * Translates internal role codes to display labels.
 * Gender: 0=unspecified, 1=female, 2=male, 3=non-binary (TMDB convention)
 */

const FEMALE_ROLE_MAP: Record<string, string> = {
  ATOR:    'ATRIZ',
  CANTOR:  'CANTORA',
  MODELO:  'MODELO',
  ARTISTA: 'ARTISTA',
}

/**
 * Returns the display label for a role, taking gender into account.
 * Female artists (gender=1) get feminine forms (ATOR→ATRIZ, CANTOR→CANTORA).
 */
export function getRoleLabel(role: string, gender?: number | null): string {
  if (gender === 1) {
    return FEMALE_ROLE_MAP[role] ?? role
  }
  return role
}

/**
 * Returns display labels for all roles of an artist.
 */
export function getRoleLabels(roles: string[], gender?: number | null): string[] {
  return roles.map(r => getRoleLabel(r, gender))
}
