export const AFFILIATE_PLACEMENTS = {
    store_featured: 'Loja: escolhas da curadoria',
    store_catalog: 'Loja: catálogo',
    store_coupon: 'Loja: cupons',
    home_store: 'Home: vitrine',
    agency_store: 'Agência: vitrine',
    related_store: 'Conteúdo: relacionados',
    calendar_store: 'Calendário: vitrine',
    unknown: 'Origem não identificada',
} as const

export type AffiliatePlacement = keyof typeof AFFILIATE_PLACEMENTS

export function isAffiliatePlacement(value: unknown): value is AffiliatePlacement {
    return typeof value === 'string' && value in AFFILIATE_PLACEMENTS
}
