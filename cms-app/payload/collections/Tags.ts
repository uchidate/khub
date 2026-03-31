import type { CollectionConfig, CollectionAfterChangeHook } from 'payload'
import { Pool } from 'pg'

const syncToPrisma: CollectionAfterChangeHook = async ({ doc, operation }) => {
    if (!doc.name) return doc
    const pool = new Pool({ connectionString: process.env.DATABASE_URL })
    try {
        if (operation === 'create') {
            const res = await pool.query(
                `INSERT INTO public."Tag" (id, name, type)
                 VALUES ($1, $2, $3)
                 ON CONFLICT (name) DO UPDATE SET type = EXCLUDED.type
                 RETURNING id`,
                [doc.prismaId || doc.id?.toString(), doc.name, doc.type ?? 'GENERAL']
            )
            // Store prismaId back if newly created
            if (!doc.prismaId && res.rows[0]?.id) {
                await pool.query(
                    `UPDATE payload.tags SET prisma_id = $1 WHERE id = $2`,
                    [res.rows[0].id, doc.id]
                )
            }
        } else {
            await pool.query(
                `UPDATE public."Tag" SET name = $1, type = $2 WHERE id = $3`,
                [doc.name, doc.type ?? 'GENERAL', doc.prismaId]
            )
        }
    } finally {
        await pool.end()
    }
    return doc
}

export const Tags: CollectionConfig = {
    slug: 'tags',
    labels: { singular: 'Tag', plural: 'Tags' },
    admin: {
        useAsTitle: 'name',
        defaultColumns: ['name', 'type'],
        group: 'Conteúdo',
    },
    access: { read: () => true, create: () => true, update: () => true, delete: () => true },
    hooks: { afterChange: [syncToPrisma] },
    fields: [
        {
            name: 'prismaId',
            type: 'text',
            unique: true,
            label: 'ID Prisma',
            admin: { description: 'ID em public.Tag — não alterar', position: 'sidebar' },
        },
        {
            name: 'name',
            type: 'text',
            required: true,
            unique: true,
            label: 'Nome',
        },
        {
            name: 'type',
            type: 'select',
            label: 'Tipo',
            admin: { position: 'sidebar' },
            options: [
                { label: 'Geral',      value: 'GENERAL' },
                { label: 'Gênero',     value: 'GENRE' },
                { label: 'Mood',       value: 'MOOD' },
                { label: 'Tema',       value: 'THEME' },
                { label: 'Era',        value: 'ERA' },
                { label: 'Conceito',   value: 'CONCEPT' },
            ],
        },
    ],
    timestamps: true,
}
