/**
 * Insere um artigo de blog no banco via Prisma.
 *
 * Uso:
 *   DATABASE_URL=... npx tsx scripts/insert-article.ts /caminho/artigo.json
 *
 * O JSON deve seguir o formato ArticleInput abaixo.
 * Campos com default podem ser omitidos.
 *
 * Dentro do container Docker:
 *   npx tsx scripts/insert-article.ts /tmp/artigo.json
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'
import prisma from '../lib/prisma'

// ── Tipos ──────────────────────────────────────────────────────────────────

interface Block {
  type: string
  [key: string]: unknown
}

interface ArticleInput {
  title: string
  slug: string
  excerpt: string
  coverImageUrl?: string
  /** Slug da categoria (ex: 'k-pop', 'cultura', 'k-drama') */
  category: string
  /** Array de até 4 tags */
  tags: string[]
  /** Tempo de leitura em minutos */
  readingTimeMin?: number
  /** 'free' | 'idol_bio' | 'review' | 'ranking' — padrão: 'free' */
  template?: string
  featured?: boolean
  /** Array de blocos de conteúdo */
  blocks: Block[]
}

// ── Constantes ─────────────────────────────────────────────────────────────

// ID do usuário admin — fixo, não muda
const ADMIN_AUTHOR_ID = 'f6c14838-660b-4c77-9d06-32c30e4de7d5'

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const filePath = process.argv[2]
  if (!filePath) {
    console.error('Uso: npx tsx scripts/insert-article.ts <arquivo.json>')
    process.exit(1)
  }

  const raw = readFileSync(resolve(filePath), 'utf-8')
  const input: ArticleInput = JSON.parse(raw)

  // Validação mínima
  const required = ['title', 'slug', 'excerpt', 'category', 'tags', 'blocks'] as const
  for (const field of required) {
    if (!input[field]) {
      console.error(`Campo obrigatório ausente: ${field}`)
      process.exit(1)
    }
  }

  // Resolver categoria pelo slug
  const category = await prisma.blogCategory.findUnique({
    where: { slug: input.category },
  })
  if (!category) {
    const available = await prisma.blogCategory.findMany({ select: { slug: true } })
    console.error(`Categoria "${input.category}" não encontrada.`)
    console.error(`Disponíveis: ${available.map(c => c.slug).join(', ')}`)
    process.exit(1)
  }

  // Verificar se slug já existe
  const existing = await prisma.blogPost.findUnique({ where: { slug: input.slug } })
  if (existing) {
    console.error(`Slug "${input.slug}" já existe (id: ${existing.id}).`)
    console.error('Use outro slug ou delete o existente antes.')
    process.exit(1)
  }

  const post = await prisma.blogPost.create({
    data: {
      title:          input.title,
      slug:           input.slug,
      excerpt:        input.excerpt,
      contentMd:      '',
      coverImageUrl:  input.coverImageUrl ?? null,
      categoryId:     category.id,
      tags:           input.tags,
      readingTimeMin: input.readingTimeMin ?? 7,
      template:       input.template ?? 'free',
      featured:       input.featured ?? false,
      status:         'PUBLISHED',
      publishedAt:    new Date(),
      authorId:       ADMIN_AUTHOR_ID,
      blocks:         input.blocks as object[],
    },
  })

  console.log(`✓ Artigo criado com sucesso!`)
  console.log(`  id:  ${post.id}`)
  console.log(`  url: /blog/${post.slug}`)
}

main()
  .catch(err => { console.error(err); process.exit(1) })
  .finally(() => prisma.$disconnect())
