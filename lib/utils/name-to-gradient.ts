/**
 * Gera um gradiente CSS determinístico a partir de um nome.
 * Usado como fallback quando não há imagem de capa.
 */
export function nameToGradient(name: string): string {
    let hash = 0
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
    const h = Math.abs(hash) % 360
    return `linear-gradient(135deg, hsl(${h},70%,55%), hsl(${(h + 40) % 360},80%,65%))`
}
