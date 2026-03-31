import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
    slug: 'media',
    labels: { singular: 'Mídia', plural: 'Mídias' },
    admin: {
        group: 'Blog',
        description: 'Imagens e arquivos de upload',
    },
    access: {
        read:   () => true,
        create: () => true,
        update: () => true,
        delete: () => true,
    },
    upload: {
        staticDir: '/app/uploads',
        staticURL: '/uploads',
        mimeTypes: ['image/*'],
        imageSizes: [
            { name: 'thumbnail', width: 400, height: 300, position: 'centre' },
            { name: 'card',      width: 800, height: 600, position: 'centre' },
        ],
    },
    fields: [
        {
            name: 'alt',
            type: 'text',
            label: 'Texto alternativo',
        },
    ],
}
