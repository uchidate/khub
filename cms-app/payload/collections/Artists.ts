import type { CollectionConfig, CollectionAfterChangeHook } from 'payload'
import { Pool } from 'pg'

// Sync editorial fields back to public.Artist (Prisma schema)
const syncToPrisma: CollectionAfterChangeHook = async ({ doc }) => {
    if (!doc.prismaId) return doc
    const pool = new Pool({ connectionString: process.env.DATABASE_URL })
    try {
        await pool.query(
            `UPDATE public."Artist" SET
                "nameHangul"              = $1,
                bio                       = $2,
                "analiseEditorial"        = $3,
                curiosidades              = $4,
                "primaryImageUrl"         = $5,
                "isHidden"                = $6,
                "flaggedAsNonKorean"      = $7,
                "trendingBadgeOverride"   = $8,
                "editorialCuratedAt"      = NOW()
            WHERE id = $9`,
            [
                doc.nameHangul ?? null,
                doc.bio ?? null,
                doc.analiseEditorial ?? null,
                doc.curiosidades?.map((c: { text: string }) => c.text) ?? [],
                doc.primaryImageUrl ?? null,
                doc.isHidden ?? false,
                doc.flaggedAsNonKorean ?? false,
                doc.trendingBadgeOverride ?? null,
                doc.prismaId,
            ]
        )
    } finally {
        await pool.end()
    }
    return doc
}

export const Artists: CollectionConfig = {
    slug: 'artists',
    labels: { singular: 'Artista', plural: 'Artistas' },
    admin: {
        useAsTitle: 'nameRomanized',
        defaultColumns: ['nameRomanized', 'nameHangul', 'isHidden', 'trendingBadgeOverride', 'updatedAt'],
        group: 'K-pop',
        preview: (doc) => {
            const siteUrl = process.env.SITE_URL || 'https://www.hallyuhub.com.br'
            return doc?.prismaId ? `${siteUrl}/artistas/${doc.prismaId}` : null
        },
    },
    access: { read: () => true, create: () => true, update: () => true, delete: () => true },
    hooks: {
        afterChange: [syncToPrisma],
    },
    fields: [
        // ── Identidade ────────────────────────────────────────────────────────
        {
            name: 'prismaId',
            type: 'text',
            required: true,
            unique: true,
            label: 'ID Prisma (cuid)',
            admin: { description: 'ID do artista em public.Artist — não alterar', position: 'sidebar' },
        },
        {
            name: 'nameRomanized',
            type: 'text',
            required: true,
            label: 'Nome (romanizado)',
        },
        {
            name: 'nameHangul',
            type: 'text',
            label: 'Nome em Hangul',
        },

        // ── Conteúdo editorial ────────────────────────────────────────────────
        {
            name: 'bio',
            type: 'textarea',
            label: 'Bio curta',
            maxLength: 600,
        },
        {
            name: 'analiseEditorial',
            type: 'richText',
            label: 'Análise editorial',
            admin: { description: '400+ palavras em PT-BR' },
        },
        {
            name: 'curiosidades',
            type: 'array',
            label: 'Curiosidades',
            minRows: 0,
            maxRows: 8,
            fields: [{ name: 'text', type: 'text', required: true, label: 'Curiosidade' }],
        },

        // ── Imagem ────────────────────────────────────────────────────────────
        {
            name: 'primaryImageUrl',
            type: 'text',
            label: 'URL da imagem principal',
            admin: { position: 'sidebar' },
        },
        {
            name: 'coverMedia',
            type: 'upload',
            relationTo: 'media',
            label: 'Upload de imagem',
            admin: { position: 'sidebar', description: 'Preenche URL automaticamente' },
        },

        // ── Controle ──────────────────────────────────────────────────────────
        {
            name: 'isHidden',
            type: 'checkbox',
            label: 'Oculto do site',
            defaultValue: false,
            admin: { position: 'sidebar' },
        },
        {
            name: 'flaggedAsNonKorean',
            type: 'checkbox',
            label: 'Não-relevante (não coreano)',
            defaultValue: false,
            admin: { position: 'sidebar' },
        },
        {
            name: 'trendingBadgeOverride',
            type: 'select',
            label: 'Badge de trending (override)',
            admin: { position: 'sidebar' },
            options: [
                { label: '🔥 Hot',     value: 'HOT' },
                { label: '📈 Subindo', value: 'SUBINDO' },
                { label: '✨ Novo',    value: 'NOVO' },
            ],
        },
    ],
    timestamps: true,
}
