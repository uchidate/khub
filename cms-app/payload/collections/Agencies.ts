import type { CollectionConfig, CollectionAfterChangeHook } from 'payload'
import { Pool } from 'pg'

const syncToPrisma: CollectionAfterChangeHook = async ({ doc }) => {
    if (!doc.prismaId) return doc
    const pool = new Pool({ connectionString: process.env.DATABASE_URL })
    try {
        await pool.query(
            `UPDATE public."Agency" SET
                name          = $1,
                description   = $2,
                website       = $3,
                "logoUrl"     = $4,
                "foundedYear" = $5,
                country       = $6,
                "ceoName"     = $7,
                "accentColor" = $8,
                type          = $9,
                "isVerified"  = $10
            WHERE id = $11`,
            [
                doc.name,
                doc.description ?? null,
                doc.website ?? null,
                doc.logoUrl ?? null,
                doc.foundedYear ?? null,
                doc.country ?? 'KR',
                doc.ceoName ?? null,
                doc.accentColor ?? null,
                doc.type ?? 'INDIE',
                doc.isVerified ?? false,
                doc.prismaId,
            ]
        )
    } finally {
        await pool.end()
    }
    return doc
}

export const Agencies: CollectionConfig = {
    slug: 'agencies',
    labels: { singular: 'Agência', plural: 'Agências' },
    admin: {
        useAsTitle: 'name',
        defaultColumns: ['name', 'type', 'country', 'foundedYear', 'isVerified'],
        group: 'K-pop',
    },
    access: { read: () => true, create: () => true, update: () => true, delete: () => true },
    hooks: { afterChange: [syncToPrisma] },
    fields: [
        {
            name: 'prismaId',
            type: 'text',
            required: true,
            unique: true,
            label: 'ID Prisma',
            admin: { description: 'ID em public.Agency — não alterar', position: 'sidebar' },
        },
        {
            name: 'name',
            type: 'text',
            required: true,
            label: 'Nome',
        },
        {
            name: 'type',
            type: 'select',
            label: 'Tipo',
            admin: { position: 'sidebar' },
            options: [
                { label: 'Big 4',    value: 'BIG4' },
                { label: 'Grande',   value: 'LARGE' },
                { label: 'Média',    value: 'MID' },
                { label: 'Indie',    value: 'INDIE' },
                { label: 'Gravadora', value: 'LABEL' },
            ],
        },
        {
            name: 'country',
            type: 'text',
            label: 'País',
            defaultValue: 'KR',
            admin: { position: 'sidebar' },
        },
        {
            name: 'foundedYear',
            type: 'number',
            label: 'Ano de fundação',
            admin: { position: 'sidebar' },
        },
        {
            name: 'isVerified',
            type: 'checkbox',
            label: 'Verificada',
            defaultValue: false,
            admin: { position: 'sidebar' },
        },
        {
            name: 'description',
            type: 'textarea',
            label: 'Descrição',
        },
        {
            name: 'website',
            type: 'text',
            label: 'Site oficial',
            admin: { position: 'sidebar' },
        },
        {
            name: 'logoUrl',
            type: 'text',
            label: 'URL do logo',
            admin: { position: 'sidebar' },
        },
        {
            name: 'accentColor',
            type: 'text',
            label: 'Cor de destaque (hex)',
            admin: { position: 'sidebar', description: 'ex: #c6a852' },
        },
        {
            name: 'ceoName',
            type: 'text',
            label: 'CEO / Fundador',
            admin: { position: 'sidebar' },
        },
        {
            name: 'parent',
            type: 'relationship',
            relationTo: 'agencies',
            label: 'Agência-mãe',
            admin: { position: 'sidebar', description: 'Para sub-labels' },
        },
    ],
    timestamps: true,
}
