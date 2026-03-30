import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
    slug: 'users',
    auth: true,
    admin: {
        useAsTitle: 'email',
    },
    access: {
        // Apenas admins da plataforma podem acessar o CMS — acesso restrito
        read:   ({ req }) => req.user?.role === 'admin',
        create: ({ req }) => req.user?.role === 'admin',
        update: ({ req }) => req.user?.role === 'admin',
        delete: ({ req }) => req.user?.role === 'admin',
    },
    fields: [
        {
            name: 'name',
            type: 'text',
            label: 'Nome',
        },
        {
            name: 'role',
            type: 'select',
            label: 'Papel',
            defaultValue: 'editor',
            options: [
                { label: 'Admin', value: 'admin' },
                { label: 'Editor', value: 'editor' },
            ],
            required: true,
        },
    ],
}
