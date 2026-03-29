import type { CollectionConfig, CollectionBeforeChangeHook } from 'payload'
import { ALL_BLOG_BLOCKS } from '../blocks'

// Auto-set publishedAt when status changes to PUBLISHED; clear scheduledAt
const beforePublish: CollectionBeforeChangeHook = ({ data, originalDoc }) => {
    const wasPublished = originalDoc?.status === 'PUBLISHED'
    const isPublishing = data.status === 'PUBLISHED'
    if (isPublishing && !wasPublished && !data.publishedAt) {
        data.publishedAt = new Date().toISOString()
    }
    // Clear scheduledAt when manually publishing
    if (isPublishing && data.scheduledAt) {
        data.scheduledAt = null
    }
    return data
}

export const Posts: CollectionConfig = {
    slug: 'posts',
    labels: { singular: 'Post', plural: 'Posts' },
    hooks: {
        beforeChange: [beforePublish],
    },
    admin: {
        useAsTitle: 'title',
        defaultColumns: ['title', 'status', 'category', 'publishedAt', 'updatedAt'],
        group: 'Blog',
        preview: (doc) => {
            const slug = doc?.slug as string | undefined
            return slug ? `/blog/${slug}` : null
        },
    },
    // Access: middleware already ensures only admins reach /cms
    access: {
        read:   () => true,
        create: () => true,
        update: () => true,
        delete: () => true,
    },
    fields: [
        // ── Identidade ────────────────────────────────────────────────────────
        {
            name: 'title',
            type: 'text',
            required: true,
            label: 'Título',
        },
        {
            name: 'slug',
            type: 'text',
            required: true,
            unique: true,
            label: 'Slug',
            admin: {
                description: 'Identificador único na URL (ex: top-10-kdramas-2024)',
            },
        },
        {
            name: 'excerpt',
            type: 'textarea',
            label: 'Resumo',
            maxLength: 600,
        },
        {
            name: 'coverImageUrl',
            type: 'text',
            label: 'URL da imagem de capa',
        },

        // ── Conteúdo em blocos ────────────────────────────────────────────────
        {
            name: 'blocks',
            type: 'blocks',
            label: 'Conteúdo',
            blocks: ALL_BLOG_BLOCKS,
        },

        // ── Publicação ────────────────────────────────────────────────────────
        {
            name: 'status',
            type: 'select',
            required: true,
            label: 'Status',
            defaultValue: 'DRAFT',
            options: [
                { label: 'Rascunho',   value: 'DRAFT' },
                { label: 'Publicado',  value: 'PUBLISHED' },
                { label: 'Arquivado', value: 'ARCHIVED' },
            ],
            admin: { position: 'sidebar' },
        },
        {
            name: 'publishedAt',
            type: 'date',
            label: 'Publicado em',
            admin: { position: 'sidebar', date: { pickerAppearance: 'dayAndTime' } },
        },
        {
            name: 'scheduledAt',
            type: 'date',
            label: 'Agendar publicação',
            admin: {
                position: 'sidebar',
                date: { pickerAppearance: 'dayAndTime' },
                description: 'Publicação automática quando scheduledAt ≤ agora e status = DRAFT',
            },
        },

        // ── Organização ───────────────────────────────────────────────────────
        {
            name: 'category',
            type: 'relationship',
            relationTo: 'categories',
            label: 'Categoria',
            admin: { position: 'sidebar' },
        },
        {
            name: 'tags',
            type: 'array',
            label: 'Tags',
            admin: { position: 'sidebar' },
            fields: [
                { name: 'tag', type: 'text', required: true, label: 'Tag' },
            ],
        },
        {
            name: 'template',
            type: 'select',
            label: 'Template',
            admin: { position: 'sidebar' },
            options: [
                { label: 'Livre',            value: 'free' },
                { label: 'Biografia de Idol', value: 'idol_bio' },
                { label: 'Review',           value: 'review' },
                { label: 'Ranking',          value: 'ranking' },
            ],
        },

        // ── Flags ────────────────────────────────────────────────────────────
        {
            name: 'featured',
            type: 'checkbox',
            label: 'Destaque',
            defaultValue: false,
            admin: { position: 'sidebar' },
        },
        {
            name: 'isPrivate',
            type: 'checkbox',
            label: 'Privado (visível apenas para admins)',
            defaultValue: false,
            admin: { position: 'sidebar' },
        },

        // ── Author (string ID para compatibilidade com Prisma) ────────────────
        {
            name: 'authorId',
            type: 'text',
            label: 'ID do autor (Prisma)',
            admin: { position: 'sidebar', readOnly: true },
        },

        // ── SEO ──────────────────────────────────────────────────────────────
        {
            name: 'seo',
            type: 'group',
            label: 'SEO',
            admin: {
                description: 'Override de meta tags para este post',
            },
            fields: [
                { name: 'metaTitle',   type: 'text', label: 'Meta título',       maxLength: 70 },
                { name: 'metaDesc',    type: 'text', label: 'Meta descrição',    maxLength: 160 },
                { name: 'ogImageUrl',  type: 'text', label: 'OG image URL' },
                { name: 'noIndex',     type: 'checkbox', label: 'noIndex', defaultValue: false },
            ],
        },
    ],
    timestamps: true,
}
