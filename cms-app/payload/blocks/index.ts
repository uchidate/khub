import type { Block } from 'payload'

export const HeadingBlock: Block = {
    slug: 'blog_heading',
    labels: { singular: 'Título', plural: 'Títulos' },
    fields: [
        { name: 'text',  type: 'text',   required: true, label: 'Texto' },
        { name: 'level', type: 'select', required: true, label: 'Nível',
          options: [
              { label: 'H1', value: '1' },
              { label: 'H2', value: '2' },
              { label: 'H3', value: '3' },
          ],
          defaultValue: '2',
        },
    ],
}

export const ParagraphBlock: Block = {
    slug: 'blog_paragraph',
    labels: { singular: 'Parágrafo', plural: 'Parágrafos' },
    fields: [
        { name: 'text', type: 'textarea', required: true, label: 'Texto' },
    ],
}

export const QuoteBlock: Block = {
    slug: 'blog_quote',
    labels: { singular: 'Citação', plural: 'Citações' },
    fields: [
        { name: 'text',   type: 'textarea', required: true, label: 'Citação' },
        { name: 'author', type: 'text',     label: 'Autor (opcional)' },
    ],
}

export const ImageBlock: Block = {
    slug: 'blog_image',
    labels: { singular: 'Imagem', plural: 'Imagens' },
    fields: [
        { name: 'url',       type: 'text',   required: true, label: 'URL da imagem' },
        { name: 'caption',   type: 'text',   label: 'Legenda' },
        { name: 'fullWidth', type: 'checkbox', label: 'Largura total', defaultValue: false },
        { name: 'size',      type: 'select', label: 'Tamanho',
          options: [
              { label: 'Pequeno', value: 'small' },
              { label: 'Médio',   value: 'medium' },
              { label: 'Total',   value: 'full' },
          ],
          defaultValue: 'medium',
        },
    ],
}

export const GalleryBlock: Block = {
    slug: 'blog_gallery',
    labels: { singular: 'Galeria', plural: 'Galerias' },
    fields: [
        { name: 'urls',    type: 'array', label: 'Imagens', minRows: 1,
          fields: [{ name: 'url', type: 'text', required: true, label: 'URL' }],
        },
        { name: 'caption', type: 'text', label: 'Legenda da galeria' },
    ],
}

export const VideoBlock: Block = {
    slug: 'blog_video',
    labels: { singular: 'Vídeo', plural: 'Vídeos' },
    fields: [
        { name: 'url',     type: 'text', required: true, label: 'URL do vídeo (YouTube, etc.)' },
        { name: 'caption', type: 'text', label: 'Legenda' },
    ],
}

export const TwitterBlock: Block = {
    slug: 'blog_twitter',
    labels: { singular: 'Tweet', plural: 'Tweets' },
    fields: [
        { name: 'url', type: 'text', required: true, label: 'URL do tweet' },
    ],
}

export const InstagramBlock: Block = {
    slug: 'blog_instagram',
    labels: { singular: 'Instagram', plural: 'Posts do Instagram' },
    fields: [
        { name: 'url', type: 'text', required: true, label: 'URL do post do Instagram' },
    ],
}

export const TikTokBlock: Block = {
    slug: 'blog_tiktok',
    labels: { singular: 'TikTok', plural: 'Vídeos do TikTok' },
    fields: [
        { name: 'url', type: 'text', required: true, label: 'URL do TikTok' },
    ],
}

export const ArtistCardBlock: Block = {
    slug: 'blog_artist_card',
    labels: { singular: 'Card de Artista', plural: 'Cards de Artistas' },
    fields: [
        { name: 'artistId', type: 'text', required: true, label: 'ID do artista' },
        { name: 'note',     type: 'text', label: 'Anotação editorial' },
        { name: 'compact',  type: 'checkbox', label: 'Compacto', defaultValue: false },
    ],
}

export const ProductionCardBlock: Block = {
    slug: 'blog_production_card',
    labels: { singular: 'Card de Produção', plural: 'Cards de Produções' },
    fields: [
        { name: 'productionId', type: 'text', required: true, label: 'ID da produção' },
        { name: 'note',         type: 'text', label: 'Anotação editorial' },
        { name: 'compact',      type: 'checkbox', label: 'Compacto', defaultValue: false },
    ],
}

export const GroupCardBlock: Block = {
    slug: 'blog_group_card',
    labels: { singular: 'Card de Grupo', plural: 'Cards de Grupos' },
    fields: [
        { name: 'groupId', type: 'text', required: true, label: 'ID do grupo' },
        { name: 'note',    type: 'text', label: 'Anotação editorial' },
        { name: 'compact', type: 'checkbox', label: 'Compacto', defaultValue: false },
    ],
}

export const StatsRowBlock: Block = {
    slug: 'blog_stats_row',
    labels: { singular: 'Linha de Stats', plural: 'Linhas de Stats' },
    fields: [
        { name: 'items', type: 'array', label: 'Itens', minRows: 1,
          fields: [
              { name: 'label', type: 'text', required: true, label: 'Rótulo' },
              { name: 'value', type: 'text', required: true, label: 'Valor' },
          ],
        },
    ],
}

export const RatingBlock: Block = {
    slug: 'blog_rating',
    labels: { singular: 'Avaliação', plural: 'Avaliações' },
    fields: [
        { name: 'score',   type: 'number', required: true, label: 'Nota (0–10)', min: 0, max: 10 },
        { name: 'label',   type: 'text',   label: 'Rótulo (ex: Álbum, Drama)' },
        { name: 'summary', type: 'textarea', label: 'Resumo da avaliação' },
    ],
}

export const DividerBlock: Block = {
    slug: 'blog_divider',
    labels: { singular: 'Divisor', plural: 'Divisores' },
    fields: [],
}

export const CalloutBlock: Block = {
    slug: 'blog_callout',
    labels: { singular: 'Destaque', plural: 'Destaques' },
    fields: [
        { name: 'variant', type: 'select', required: true, label: 'Tipo',
          options: [
              { label: 'Fato',     value: 'fact' },
              { label: 'Dado',     value: 'stat' },
              { label: 'Info',     value: 'info' },
              { label: 'Atenção', value: 'warning' },
          ],
          defaultValue: 'info',
        },
        { name: 'title', type: 'text',     label: 'Título (opcional)' },
        { name: 'text',  type: 'textarea', required: true, label: 'Texto' },
    ],
}

export const ALL_BLOG_BLOCKS: Block[] = [
    HeadingBlock,
    ParagraphBlock,
    QuoteBlock,
    ImageBlock,
    GalleryBlock,
    VideoBlock,
    TwitterBlock,
    InstagramBlock,
    TikTokBlock,
    ArtistCardBlock,
    ProductionCardBlock,
    GroupCardBlock,
    StatsRowBlock,
    RatingBlock,
    DividerBlock,
    CalloutBlock,
]
