import type { CollectionConfig } from 'payload'

export const Categories: CollectionConfig = {
    slug: 'categories',
    labels: { singular: 'Categoria', plural: 'Categorias' },
    admin: {
        useAsTitle: 'name',
        defaultColumns: ['name', 'slug', 'createdAt'],
        group: 'Blog',
    },
    // Access: middleware already ensures only admins reach /cms
    access: {
        read:   () => true,
        create: () => true,
        update: () => true,
        delete: () => true,
    },
    fields: [
        {
            name: 'name',
            type: 'text',
            required: true,
            unique: true,
            label: 'Nome',
        },
        {
            name: 'slug',
            type: 'text',
            required: true,
            unique: true,
            label: 'Slug',
            admin: {
                description: 'Identificador único na URL (ex: k-pop, k-drama)',
            },
        },
    ],
    timestamps: true,
}
