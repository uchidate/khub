import type { BlogBlock } from '@/lib/types/blocks'
import { hasSponsoredTag } from '@/lib/adsense/policy'

export type BlogPublishGuardInput = {
  title: string
  slug: string
  excerpt?: string | null
  contentMd?: string | null
  blocks?: unknown
  coverImageUrl?: string | null
  categoryId?: string | null
  tags?: string[]
  isPrivate?: boolean | null
  isSponsored?: boolean | null
  adsDisabled?: boolean | null
  relatedCounts?: {
    artists: number
    groups: number
    productions: number
  }
}

export type PublishGuardIssue = {
  id: string
  severity: 'error' | 'warning' | 'info'
  area: 'seo' | 'content' | 'ads' | 'images' | 'links'
  message: string
}

const MIN_TITLE = 30
const MAX_TITLE = 70
const MIN_EXCERPT = 80
const MAX_EXCERPT = 160
const MIN_WORDS = 350
const MIN_BLOCKS = 6

function textFromBlocks(blocks: BlogBlock[]) {
  const pieces: string[] = []
  for (const block of blocks) {
    const b = block as Record<string, unknown>
    if (typeof b.text === 'string') pieces.push(b.text)
    if (typeof b.title === 'string') pieces.push(b.title)
    if (Array.isArray(b.items)) {
      for (const item of b.items) {
        if (typeof item === 'string') pieces.push(item)
        if (typeof item === 'object' && item && 'text' in item && typeof item.text === 'string') pieces.push(item.text)
      }
    }
  }
  return pieces.join(' ')
}

function wordCount(input: BlogPublishGuardInput) {
  const blocks = Array.isArray(input.blocks) ? input.blocks as BlogBlock[] : []
  const text = blocks.length > 0 ? textFromBlocks(blocks) : input.contentMd ?? ''
  return text.split(/\s+/).filter(Boolean).length
}

function hasHeading(input: BlogPublishGuardInput) {
  const blocks = Array.isArray(input.blocks) ? input.blocks as BlogBlock[] : []
  if (blocks.some(block => block.type === 'blog_heading')) return true
  return /^#{2,3}\s+/m.test(input.contentMd ?? '')
}

function imageIssues(input: BlogPublishGuardInput): PublishGuardIssue[] {
  const issues: PublishGuardIssue[] = []
  if (!input.coverImageUrl) {
    issues.push({ id: 'missing-cover', severity: 'warning', area: 'images', message: 'Post sem imagem de capa.' })
  }

  const blocks = Array.isArray(input.blocks) ? input.blocks as BlogBlock[] : []
  blocks.forEach((block, index) => {
    if (block.type === 'blog_image') {
      if (!block.url) issues.push({ id: `image-url-${index}`, severity: 'error', area: 'images', message: `Imagem do bloco ${index + 1} sem URL.` })
      if (!block.alt || block.alt.trim().length < 8) issues.push({ id: `image-alt-${index}`, severity: 'warning', area: 'images', message: `Imagem do bloco ${index + 1} sem alt text útil.` })
    }
    if (block.type === 'blog_gallery' && (!block.urls || block.urls.length === 0)) {
      issues.push({ id: `gallery-empty-${index}`, severity: 'error', area: 'images', message: `Galeria do bloco ${index + 1} sem imagens.` })
    }
  })

  return issues
}

export function evaluateBlogPublishGuard(input: BlogPublishGuardInput) {
  const issues: PublishGuardIssue[] = []
  const words = wordCount(input)
  const blocks = Array.isArray(input.blocks) ? input.blocks as BlogBlock[] : []
  const relatedTotal = (input.relatedCounts?.artists ?? 0) + (input.relatedCounts?.groups ?? 0) + (input.relatedCounts?.productions ?? 0)

  if (!input.slug || input.slug.length < 3) issues.push({ id: 'missing-slug', severity: 'error', area: 'seo', message: 'Slug ausente ou curto demais.' })
  if (input.title.length < MIN_TITLE) issues.push({ id: 'short-title', severity: 'warning', area: 'seo', message: `Título curto. Mire pelo menos ${MIN_TITLE} caracteres.` })
  if (input.title.length > MAX_TITLE) issues.push({ id: 'long-title', severity: 'warning', area: 'seo', message: `Título longo. Tente ficar abaixo de ${MAX_TITLE} caracteres.` })
  if (!input.excerpt || input.excerpt.length < MIN_EXCERPT) issues.push({ id: 'short-excerpt', severity: 'warning', area: 'seo', message: `Meta/excerpt curto. Mire ${MIN_EXCERPT}-${MAX_EXCERPT} caracteres.` })
  if (input.excerpt && input.excerpt.length > MAX_EXCERPT) issues.push({ id: 'long-excerpt', severity: 'warning', area: 'seo', message: `Meta/excerpt longo. Tente ficar abaixo de ${MAX_EXCERPT} caracteres.` })
  if (!input.categoryId) issues.push({ id: 'missing-category', severity: 'warning', area: 'seo', message: 'Post sem categoria.' })
  if (!input.tags || input.tags.length === 0) issues.push({ id: 'missing-tags', severity: 'info', area: 'seo', message: 'Post sem tags editoriais.' })

  if (words < MIN_WORDS) issues.push({ id: 'thin-content', severity: 'error', area: 'content', message: `Conteúdo com ${words} palavras. Mire pelo menos ${MIN_WORDS}.` })
  if (blocks.length > 0 && blocks.length < MIN_BLOCKS) issues.push({ id: 'few-blocks', severity: 'warning', area: 'content', message: `Poucos blocos editoriais (${blocks.length}).` })
  if (!hasHeading(input)) issues.push({ id: 'missing-heading', severity: 'warning', area: 'content', message: 'Conteúdo sem H2/H3 para escaneabilidade.' })
  if (relatedTotal === 0) issues.push({ id: 'missing-entity-links', severity: 'warning', area: 'links', message: 'Post sem vínculo com artistas, grupos ou produções.' })

  issues.push(...imageIssues(input))

  const sponsored = input.isSponsored === true || hasSponsoredTag(input.tags ?? [])
  if (sponsored && input.adsDisabled !== true) {
    issues.push({ id: 'sponsored-ads-enabled', severity: 'error', area: 'ads', message: 'Conteúdo patrocinado deve ficar sem AdSense.' })
  }
  if (input.isPrivate) {
    issues.push({ id: 'private-post', severity: 'info', area: 'seo', message: 'Post privado não deve entrar em sitemap nem inventário de ads.' })
  }

  const errors = issues.filter(issue => issue.severity === 'error').length
  const warnings = issues.filter(issue => issue.severity === 'warning').length
  const score = Math.max(0, 100 - errors * 25 - warnings * 8 - issues.filter(issue => issue.severity === 'info').length * 2)

  return {
    score,
    publishable: errors === 0,
    wordCount: words,
    blockCount: blocks.length,
    issues,
  }
}
