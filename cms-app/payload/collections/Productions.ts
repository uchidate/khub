import type { CollectionConfig, CollectionAfterChangeHook } from 'payload'
import { Pool } from 'pg'

const syncToPrisma: CollectionAfterChangeHook = async ({ doc }) => {
    if (!doc.prismaId) return doc
    const pool = new Pool({ connectionString: process.env.DATABASE_URL })
    try {
        await pool.query(
            `UPDATE public."Production" SET
                synopsis            = $1,
                "editorialReview"   = $2,
                "whyWatch"          = $3,
                "editorialRating"   = $4,
                "isHidden"          = $5,
                "needsCuration"     = $6,
                "editorialGeneratedAt" = NOW()
            WHERE id = $7`,
            [
                doc.synopsis ?? null,
                doc.editorialReview ?? null,
                doc.whyWatch ?? null,
                doc.editorialRating ?? null,
                doc.isHidden ?? false,
                doc.needsCuration ?? false,
                doc.prismaId,
            ]
        )
    } finally {
        await pool.end()
    }
    return doc
}

export const Productions: CollectionConfig = {
    slug: 'productions',
    labels: { singular: 'Produção', plural: 'Produções' },
    admin: {
        useAsTitle: 'titlePt',
        defaultColumns: ['titlePt', 'type', 'year', 'editorialRating', 'needsCuration', 'isHidden', 'updatedAt'],
        group: 'K-pop',
        preview: (doc) => {
            const siteUrl = process.env.SITE_URL || 'https://www.hallyuhub.com.br'
            return doc?.prismaId ? `${siteUrl}/producoes/${doc.prismaId}` : null
        },
    },
    access: { read: () => true, create: () => true, update: () => true, delete: () => true },
    hooks: { afterChange: [syncToPrisma] },
    fields: [
        // ── Identidade ────────────────────────────────────────────────────────
        {
            name: 'prismaId',
            type: 'text',
            required: true,
            unique: true,
            label: 'ID Prisma (cuid)',
            admin: { description: 'ID em public.Production — não alterar', position: 'sidebar' },
        },
        {
            name: 'titlePt',
            type: 'text',
            required: true,
            label: 'Título (PT)',
        },
        {
            name: 'titleKr',
            type: 'text',
            label: 'Título (KR)',
        },
        {
            name: 'type',
            type: 'select',
            label: 'Tipo',
            admin: { position: 'sidebar' },
            options: [
                { label: 'K-Drama', value: 'K-Drama' },
                { label: 'Filme',   value: 'Filme' },
                { label: 'Série',   value: 'SERIE' },
                { label: 'Show',    value: 'SHOW' },
            ],
        },
        {
            name: 'year',
            type: 'number',
            label: 'Ano',
            admin: { position: 'sidebar' },
        },
        {
            name: 'releaseDate',
            type: 'date',
            label: 'Data de lançamento',
            admin: { position: 'sidebar' },
        },
        {
            name: 'network',
            type: 'text',
            label: 'Canal / Plataforma',
            admin: { position: 'sidebar' },
        },
        {
            name: 'ageRating',
            type: 'text',
            label: 'Classificação etária',
            admin: { position: 'sidebar' },
        },
        {
            name: 'runtime',
            type: 'number',
            label: 'Duração (min)',
            admin: { position: 'sidebar' },
        },
        {
            name: 'episodeCount',
            type: 'number',
            label: 'Nº de episódios',
            admin: { position: 'sidebar' },
        },

        // ── Conteúdo editorial ────────────────────────────────────────────────
        {
            name: 'synopsis',
            type: 'textarea',
            label: 'Sinopse',
        },
        {
            name: 'editorialReview',
            type: 'richText',
            label: 'Review editorial',
            admin: { description: 'Análise crítica completa em PT-BR' },
        },
        {
            name: 'whyWatch',
            type: 'richText',
            label: 'Por que assistir?',
        },
        {
            name: 'editorialRating',
            type: 'number',
            label: 'Nota editorial (0–10)',
            min: 0,
            max: 10,
            admin: { position: 'sidebar', step: 0.1 },
        },

        // ── Mídia ─────────────────────────────────────────────────────────────
        {
            name: 'imageUrl',
            type: 'text',
            label: 'URL do poster',
            admin: { position: 'sidebar' },
        },
        {
            name: 'backdropUrl',
            type: 'text',
            label: 'URL do backdrop',
            admin: { position: 'sidebar' },
        },
        {
            name: 'trailerUrl',
            type: 'text',
            label: 'URL do trailer',
            admin: { position: 'sidebar' },
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
            name: 'needsCuration',
            type: 'checkbox',
            label: 'Precisa de curadoria',
            defaultValue: false,
            admin: { position: 'sidebar', description: 'Marque para priorizar na fila editorial' },
        },
        {
            name: 'isTakenDown',
            type: 'checkbox',
            label: 'Removido / Takedown',
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
    ],
    timestamps: true,
}
