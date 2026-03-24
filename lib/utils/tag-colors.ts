import { BLOG_CATEGORY_BY_SLUG } from '@/lib/config/categories'

export interface TagStyle {
    color: string
    bg: string
}

/**
 * Pastel palette for freeform tags.
 * Each tag gets a consistent color derived from its name (stable hash).
 */
const PASTEL_PALETTE: TagStyle[] = [
    { color: '#ec4899', bg: '#fce7f3' }, // pink
    { color: '#8b5cf6', bg: '#ede9fe' }, // violet
    { color: '#0ea5e9', bg: '#e0f2fe' }, // sky
    { color: '#f59e0b', bg: '#fef3c7' }, // amber
    { color: '#10b981', bg: '#d1fae5' }, // emerald
    { color: '#f97316', bg: '#ffedd5' }, // orange
    { color: '#d946ef', bg: '#fae8ff' }, // fuchsia
    { color: '#6366f1', bg: '#e0e7ff' }, // indigo
    { color: '#a855f7', bg: '#f3e8ff' }, // purple
    { color: '#f43f5e', bg: '#ffe4e6' }, // rose
    { color: '#14b8a6', bg: '#ccfbf1' }, // teal
    { color: '#eab308', bg: '#fefce8' }, // yellow
]

function hashTag(tag: string): number {
    let h = 0
    for (let i = 0; i < tag.length; i++) {
        h = (h * 31 + tag.charCodeAt(i)) >>> 0
    }
    return h
}

/**
 * Returns a pastel { color, bg } for any tag string.
 * - Tags that match a known category slug use the category color.
 * - All other tags get a stable pastel color from a hash of their name.
 */
export function getTagStyle(tag: string): TagStyle {
    const key = tag.toLowerCase().replace(/\s+/g, '-')
    const cat = BLOG_CATEGORY_BY_SLUG[key]
    if (cat) return { color: cat.color, bg: cat.bg }
    return PASTEL_PALETTE[hashTag(key) % PASTEL_PALETTE.length]
}
