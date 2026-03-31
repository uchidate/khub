import type { CollectionConfig, CollectionAfterChangeHook } from 'payload'
import { Pool } from 'pg'

// Sync editorial fields back to public.MusicalGroup (Prisma schema)
const syncToPrisma: CollectionAfterChangeHook = async ({ doc }) => {
    if (!doc.prismaId) return doc
    const pool = new Pool({ connectionString: process.env.DATABASE_URL })
    try {
        await pool.query(
            `UPDATE public."MusicalGroup" SET
                "nameHangul"            = $1,
                bio                     = $2,
                "analiseEditorial"      = $3,
                curiosidades            = $4,
                "profileImageUrl"       = $5,
                "isHidden"              = $6,
                "fanClubName"           = $7,
                "officialColor"         = $8,
                "debutDate"             = $9,
                "disbandDate"           = $10
            WHERE id = $11`,
            [
                doc.nameHangul ?? null,
                doc.bio ?? null,
                doc.analiseEditorial ?? null,
                doc.curiosidades?.map((c: { text: string }) => c.text) ?? [],
                doc.profileImageUrl ?? null,
                doc.isHidden ?? false,
                doc.fanClubName ?? null,
                doc.officialColor ?? null,
                doc.debutDate ?? null,
                doc.disbandDate ?? null,
                doc.prismaId,
            ]
        )
    } finally {
        await pool.end()
    }
    return doc
}

export const MusicalGroups: CollectionConfig = {
    slug: 'musical-groups',
    labels: { singular: 'Grupo', plural: 'Grupos' },
    admin: {
        useAsTitle: 'name',
        defaultColumns: ['name', 'nameHangul', 'debutDate', 'isHidden', 'updatedAt'],
        group: 'K-pop',
        preview: (doc) => {
            const siteUrl = process.env.SITE_URL || 'https://www.hallyuhub.com.br'
            return doc?.prismaId ? `${siteUrl}/grupos/${doc.prismaId}` : null
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
            admin: { description: 'ID do grupo em public.MusicalGroup — não alterar', position: 'sidebar' },
        },
        {
            name: 'name',
            type: 'text',
            required: true,
            label: 'Nome',
        },
        {
            name: 'nameHangul',
            type: 'text',
            label: 'Nome em Hangul',
        },
        {
            name: 'fanClubName',
            type: 'text',
            label: 'Nome do fandom',
            admin: { position: 'sidebar', description: 'ex: ARMY, BLINK, ONCE' },
        },
        {
            name: 'officialColor',
            type: 'text',
            label: 'Cor oficial (hex)',
            admin: { position: 'sidebar', description: 'ex: #c6a852' },
        },

        // ── Conteúdo editorial ────────────────────────────────────────────────
        {
            name: 'bio',
            type: 'textarea',
            label: 'Bio curta',
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
            name: 'profileImageUrl',
            type: 'text',
            label: 'URL da imagem de perfil',
            admin: { position: 'sidebar' },
        },
        {
            name: 'coverMedia',
            type: 'upload',
            relationTo: 'media',
            label: 'Upload de imagem',
            admin: { position: 'sidebar' },
        },

        // ── Datas ─────────────────────────────────────────────────────────────
        {
            name: 'debutDate',
            type: 'date',
            label: 'Data de estreia',
            admin: { position: 'sidebar' },
        },
        {
            name: 'disbandDate',
            type: 'date',
            label: 'Data de disbandamento',
            admin: { position: 'sidebar', description: 'Deixe vazio se ainda ativo' },
        },

        // ── Controle ──────────────────────────────────────────────────────────
        {
            name: 'isHidden',
            type: 'checkbox',
            label: 'Oculto do site',
            defaultValue: false,
            admin: { position: 'sidebar' },
        },

        // ── Relações ──────────────────────────────────────────────────────────
        {
            name: 'agency',
            type: 'relationship',
            relationTo: 'agencies',
            label: 'Agência',
            admin: { position: 'sidebar' },
        },
        {
            name: 'members',
            type: 'relationship',
            relationTo: 'artists',
            hasMany: true,
            label: 'Membros',
            admin: { description: 'Artistas que fazem ou fizeram parte deste grupo' },
        },
    ],
    timestamps: true,
}
