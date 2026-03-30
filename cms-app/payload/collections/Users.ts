import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
    slug: 'users',
    auth: true,
    admin: {
        useAsTitle: 'email',
    },
    // Access: middleware NextAuth já garante que apenas admins chegam ao /cms
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
