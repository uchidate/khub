import type { CollectionConfig } from 'payload'

export const Albums: CollectionConfig = {
    slug: 'albums',
    labels: { singular: 'Álbum', plural: 'Álbuns' },
    admin: {
        useAsTitle: 'title',
        defaultColumns: ['title', 'type', 'releaseDate', 'artist', 'updatedAt'],
        group: 'K-pop',
    },
    access: { read: () => true, create: () => true, update: () => true, delete: () => true },
    fields: [
        {
            name: 'prismaId',
            type: 'text',
            required: true,
            unique: true,
            label: 'ID Prisma',
            admin: { description: 'ID em public.Album — não alterar', position: 'sidebar' },
        },
        {
            name: 'title',
            type: 'text',
            required: true,
            label: 'Título',
        },
        {
            name: 'type',
            type: 'select',
            label: 'Tipo',
            admin: { position: 'sidebar' },
            options: [
                { label: 'Mini Album',  value: 'MINI_ALBUM' },
                { label: 'Full Album',  value: 'FULL_ALBUM' },
                { label: 'Single',      value: 'SINGLE' },
                { label: 'EP',          value: 'EP' },
                { label: 'OST',         value: 'OST' },
                { label: 'Repackage',   value: 'REPACKAGE' },
                { label: 'Compilação',  value: 'COMPILATION' },
            ],
        },
        {
            name: 'releaseDate',
            type: 'date',
            label: 'Data de lançamento',
            admin: { position: 'sidebar' },
        },
        {
            name: 'artist',
            type: 'relationship',
            relationTo: 'artists',
            label: 'Artista',
            admin: { position: 'sidebar' },
        },
        {
            name: 'coverUrl',
            type: 'text',
            label: 'URL da capa',
            admin: { position: 'sidebar' },
        },
        {
            name: 'spotifyUrl',
            type: 'text',
            label: 'Spotify',
            admin: { position: 'sidebar' },
        },
        {
            name: 'appleMusicUrl',
            type: 'text',
            label: 'Apple Music',
            admin: { position: 'sidebar' },
        },
        {
            name: 'youtubeUrl',
            type: 'text',
            label: 'YouTube',
            admin: { position: 'sidebar' },
        },
    ],
    timestamps: true,
}
