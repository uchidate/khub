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
    fields: [],
}
