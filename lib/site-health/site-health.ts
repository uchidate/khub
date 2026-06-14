import prisma from '@/lib/prisma'
import { SITE_URL } from '@/lib/constants/site'
import { evaluateBlogPublishGuard } from '@/lib/site-health/blog-guard'
import { getArtistAdChannel, getBlogAdChannel, getProductionAdChannel, shouldServeAdSense } from '@/lib/adsense/policy'
import type { BlogBlock } from '@/lib/types/blocks'

export type HealthSeverity = 'ok' | 'info' | 'warning' | 'error'

export type SiteHealthCheck = {
  id: string
  label: string
  status: HealthSeverity
  message: string
  href?: string
}

export type UrlHealthResult = {
  path: string
  url: string
  entityType: string
  entityId?: string
  title?: string
  exists: boolean
  score: number
  checks: SiteHealthCheck[]
}

const GENERIC_BIO = /conhecido\(a\) na ind[uú]stria|talentoso\(a\).*ind[uú]stria|de destaque na ind[uú]stria/i

function scoreFromChecks(checks: SiteHealthCheck[]) {
  return Math.max(0, 100
    - checks.filter(check => check.status === 'error').length * 28
    - checks.filter(check => check.status === 'warning').length * 10
    - checks.filter(check => check.status === 'info').length * 3)
}

function check(id: string, label: string, status: HealthSeverity, message: string, href?: string): SiteHealthCheck {
  return { id, label, status, message, href }
}

export function normalizeHealthPath(rawPath: string) {
  if (!rawPath.trim()) return '/'
  try {
    const url = new URL(rawPath)
    return url.pathname || '/'
  } catch {
    return rawPath.startsWith('/') ? rawPath.split('?')[0] || '/' : `/${rawPath.split('?')[0]}`
  }
}

function imageAltIssues(blocks: unknown) {
  if (!Array.isArray(blocks)) return 0
  return (blocks as BlogBlock[]).filter(block =>
    block.type === 'blog_image' && (!block.alt || block.alt.trim().length < 8)
  ).length
}

async function healthForBlog(path: string, slug: string): Promise<UrlHealthResult> {
  const post = await prisma.blogPost.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      title: true,
      excerpt: true,
      contentMd: true,
      blocks: true,
      coverImageUrl: true,
      status: true,
      isPrivate: true,
      isSponsored: true,
      adsDisabled: true,
      categoryId: true,
      category: { select: { slug: true } },
      tags: true,
      publishedAt: true,
      _count: { select: { relatedArtists: true, relatedGroups: true, relatedProductions: true } },
    },
  })

  if (!post) return missing(path, 'blog_post')

  const guard = evaluateBlogPublishGuard({
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    contentMd: post.contentMd,
    blocks: post.blocks,
    coverImageUrl: post.coverImageUrl,
    categoryId: post.categoryId,
    tags: post.tags,
    isPrivate: post.isPrivate,
    isSponsored: post.isSponsored,
    adsDisabled: post.adsDisabled,
    relatedCounts: {
      artists: post._count.relatedArtists,
      groups: post._count.relatedGroups,
      productions: post._count.relatedProductions,
    },
  })
  const isPublishedPublic = post.status === 'PUBLISHED' && !post.isPrivate && !!post.publishedAt
  const blocks = Array.isArray(post.blocks) ? post.blocks as BlogBlock[] : []
  const adChannel = getBlogAdChannel({ categorySlug: post.category?.slug, tags: post.tags, hasRating: blocks.some(block => block.type === 'blog_rating') })
  const adsAllowed = shouldServeAdSense({ adsDisabled: post.adsDisabled, isSponsored: post.isSponsored, isIndexable: isPublishedPublic })

  const checks = [
    check('exists', 'Página existe', 'ok', 'Post encontrado no banco.'),
    check('indexable', 'Indexação', isPublishedPublic ? 'ok' : 'warning', isPublishedPublic ? 'Publicado e público.' : 'Não está publicado/publicamente indexável.'),
    check('canonical', 'Canonical', 'ok', `${SITE_URL}/blog/${post.slug}`),
    check('sitemap', 'Sitemap', isPublishedPublic ? 'ok' : 'info', isPublishedPublic ? 'Elegível para sitemap.' : 'Fora do sitemap por status/privacidade.'),
    check('publish-guard', 'Publish guard', guard.publishable ? 'ok' : 'error', guard.publishable ? `Score editorial ${guard.score}.` : `${guard.issues.filter(i => i.severity === 'error').length} erro(s) no guard.`, `/admin/blog/${post.id}/edit`),
    check('ads', 'AdSense', adsAllowed ? 'ok' : 'info', adsAllowed ? `Elegível para anúncios. Canal: ${adChannel}.` : 'AdSense bloqueado por regra editorial/política.'),
    check('images', 'Imagens', imageAltIssues(post.blocks) === 0 && !!post.coverImageUrl ? 'ok' : 'warning', imageAltIssues(post.blocks) === 0 ? 'Alt text/capa ok.' : `${imageAltIssues(post.blocks)} imagem(ns) sem alt útil.`),
    check('links', 'Links internos', post._count.relatedArtists + post._count.relatedGroups + post._count.relatedProductions > 0 ? 'ok' : 'warning', 'Verifica vínculos com entidades.'),
    check('cache', 'Cache', 'ok', 'ISR de blog ativo; revalidação administrativa disponível.'),
  ]

  return { path, url: `${SITE_URL}${path}`, entityType: 'blog_post', entityId: post.id, title: post.title, exists: true, score: scoreFromChecks(checks), checks }
}

async function healthForArtist(path: string, slug: string): Promise<UrlHealthResult> {
  const artist = await prisma.artist.findFirst({
    where: { slug },
    select: {
      id: true,
      slug: true,
      nameRomanized: true,
      bio: true,
      primaryImageUrl: true,
      isHidden: true,
      roles: true,
      productions: { select: { productionId: true }, take: 1 },
    },
  })
  if (!artist) return missing(path, 'artist')

  const cleanBio = artist.bio && !GENERIC_BIO.test(artist.bio) ? artist.bio : null
  const isThin = !artist.primaryImageUrl && !cleanBio
  const indexable = !artist.isHidden && !!artist.slug && !isThin
  const adsAllowed = shouldServeAdSense({ isIndexable: indexable, isThinContent: isThin })
  const channel = getArtistAdChannel({ roles: artist.roles, hasPrimaryImage: !!artist.primaryImageUrl, hasBio: !!cleanBio, hasProductions: artist.productions.length > 0 })
  const checks = [
    check('exists', 'Página existe', 'ok', 'Artista encontrado.'),
    check('slug', 'Slug', artist.slug ? 'ok' : 'error', artist.slug ? 'Slug canônico presente.' : 'Sem slug canônico.'),
    check('indexable', 'Indexação', indexable ? 'ok' : 'warning', indexable ? 'Elegível para indexação.' : 'Oculto, thin ou sem slug.'),
    check('canonical', 'Canonical', artist.slug ? 'ok' : 'error', artist.slug ? `${SITE_URL}/artists/${artist.slug}` : 'Canonical não deve usar ID público.'),
    check('sitemap', 'Sitemap', indexable ? 'ok' : 'info', indexable ? 'Elegível para sitemap.' : 'Deve ficar fora do sitemap.'),
    check('images', 'Imagem', artist.primaryImageUrl ? 'ok' : 'warning', artist.primaryImageUrl ? 'Imagem principal presente.' : 'Sem imagem principal.'),
    check('content', 'Conteúdo', cleanBio ? 'ok' : 'warning', cleanBio ? 'Bio útil presente.' : 'Bio ausente ou genérica.'),
    check('ads', 'AdSense', adsAllowed ? 'ok' : 'info', adsAllowed ? `Elegível. Canal: ${channel}.` : 'Ads bloqueados por thin/noindex.'),
    check('cache', 'Cache', 'ok', 'ISR de perfil ativo.'),
  ]
  return { path, url: `${SITE_URL}${path}`, entityType: 'artist', entityId: artist.id, title: artist.nameRomanized, exists: true, score: scoreFromChecks(checks), checks }
}

async function healthForGroup(path: string, slug: string): Promise<UrlHealthResult> {
  const group = await prisma.musicalGroup.findFirst({
    where: { slug },
    select: { id: true, slug: true, name: true, bio: true, profileImageUrl: true, isHidden: true, members: { select: { artistId: true }, take: 1 } },
  })
  if (!group) return missing(path, 'group')

  const isThin = !group.profileImageUrl && !group.bio
  const indexable = !group.isHidden && !!group.slug && !isThin
  const checks = [
    check('exists', 'Página existe', 'ok', 'Grupo encontrado.'),
    check('slug', 'Slug', group.slug ? 'ok' : 'error', group.slug ? 'Slug canônico presente.' : 'Sem slug canônico.'),
    check('indexable', 'Indexação', indexable ? 'ok' : 'warning', indexable ? 'Elegível para indexação.' : 'Oculto, thin ou sem slug.'),
    check('canonical', 'Canonical', group.slug ? 'ok' : 'error', group.slug ? `${SITE_URL}/groups/${group.slug}` : 'Canonical não deve usar ID público.'),
    check('images', 'Imagem', group.profileImageUrl ? 'ok' : 'warning', group.profileImageUrl ? 'Imagem principal presente.' : 'Sem imagem principal.'),
    check('content', 'Conteúdo', group.bio ? 'ok' : 'warning', group.bio ? 'Bio presente.' : 'Bio ausente.'),
    check('links', 'Membros', group.members.length > 0 ? 'ok' : 'warning', group.members.length > 0 ? 'Tem membros vinculados.' : 'Sem membros vinculados.'),
    check('ads', 'AdSense', shouldServeAdSense({ isIndexable: indexable, isThinContent: isThin }) ? 'ok' : 'info', indexable ? 'Elegível para anúncios.' : 'Ads bloqueados por thin/noindex.'),
  ]
  return { path, url: `${SITE_URL}${path}`, entityType: 'group', entityId: group.id, title: group.name, exists: true, score: scoreFromChecks(checks), checks }
}

async function healthForProduction(path: string, slug: string): Promise<UrlHealthResult> {
  const production = await prisma.production.findFirst({
    where: { slug },
    select: { id: true, slug: true, titlePt: true, synopsis: true, imageUrl: true, isHidden: true, ageRating: true, isAdultContent: true, type: true, streamingPlatforms: true, artists: { select: { artistId: true }, take: 1 } },
  })
  if (!production) return missing(path, 'production')

  const adult = production.ageRating === '18' || production.isAdultContent === true
  const indexable = !production.isHidden && !!production.slug && !adult
  const channel = getProductionAdChannel({ type: production.type, streamingPlatforms: production.streamingPlatforms })
  const checks = [
    check('exists', 'Página existe', 'ok', 'Produção encontrada.'),
    check('slug', 'Slug', production.slug ? 'ok' : 'error', production.slug ? 'Slug canônico presente.' : 'Sem slug canônico.'),
    check('indexable', 'Indexação', indexable ? 'ok' : 'warning', indexable ? 'Elegível para indexação.' : 'Oculta, adulta ou sem slug.'),
    check('canonical', 'Canonical', production.slug ? 'ok' : 'error', production.slug ? `${SITE_URL}/productions/${production.slug}` : 'Canonical não deve usar ID público.'),
    check('images', 'Poster', production.imageUrl ? 'ok' : 'warning', production.imageUrl ? 'Poster presente.' : 'Sem poster.'),
    check('content', 'Sinopse', production.synopsis ? 'ok' : 'warning', production.synopsis ? 'Sinopse presente.' : 'Sinopse ausente.'),
    check('links', 'Elenco', production.artists.length > 0 ? 'ok' : 'warning', production.artists.length > 0 ? 'Tem elenco vinculado.' : 'Sem elenco vinculado.'),
    check('ads', 'AdSense', shouldServeAdSense({ isIndexable: indexable, isAdultContent: adult }) ? 'ok' : 'info', indexable ? `Elegível. Canal: ${channel}.` : 'Ads bloqueados por adulto/noindex.'),
  ]
  return { path, url: `${SITE_URL}${path}`, entityType: 'production', entityId: production.id, title: production.titlePt, exists: true, score: scoreFromChecks(checks), checks }
}

function missing(path: string, entityType: string): UrlHealthResult {
  const checks = [
    check('exists', 'Página existe', 'error', 'Nenhuma entidade correspondente encontrada.'),
    check('redirect', 'Redirect', 'warning', 'Verifique se precisa criar redirect 301 para uma URL canônica.'),
  ]
  return { path, url: `${SITE_URL}${path}`, entityType, exists: false, score: scoreFromChecks(checks), checks }
}

export async function getUrlHealth(rawPath: string): Promise<UrlHealthResult> {
  const path = normalizeHealthPath(rawPath)
  const [, section, slug] = path.split('/')
  if (section === 'blog' && slug && !['tag', 'category', 'preview'].includes(slug)) return healthForBlog(path, decodeURIComponent(slug))
  if (section === 'artists' && slug) return healthForArtist(path, decodeURIComponent(slug))
  if (section === 'groups' && slug) return healthForGroup(path, decodeURIComponent(slug))
  if (section === 'productions' && slug) return healthForProduction(path, decodeURIComponent(slug))

  const checks = [
    check('known-route', 'Rota conhecida', section ? 'info' : 'ok', section ? 'Rota sem auditoria específica; checks globais aplicáveis.' : 'Homepage.'),
    check('canonical', 'Canonical', 'info', `${SITE_URL}${path}`),
    check('cache', 'Cache', 'info', 'Verifique headers/revalidate conforme rota.'),
  ]
  return { path, url: `${SITE_URL}${path}`, entityType: section || 'home', exists: true, score: scoreFromChecks(checks), checks }
}

export async function getSiteHealthOverview() {
  const since7d = new Date(Date.now() - 7 * 24 * 3600_000)
  const recent404 = await prisma.serverLog.groupBy({
    by: ['path'],
    where: { status: 404, createdAt: { gte: since7d } },
    _count: { path: true },
    orderBy: { _count: { path: 'desc' } },
    take: 12,
  }).catch(() => [])

  const posts = await prisma.blogPost.findMany({
    where: { status: { in: ['DRAFT', 'PENDING_REVIEW', 'PUBLISHED'] } },
    select: {
      id: true,
      slug: true,
      title: true,
      excerpt: true,
      contentMd: true,
      blocks: true,
      coverImageUrl: true,
      categoryId: true,
      tags: true,
      isPrivate: true,
      isSponsored: true,
      adsDisabled: true,
      status: true,
      _count: { select: { relatedArtists: true, relatedGroups: true, relatedProductions: true } },
    },
    orderBy: { updatedAt: 'desc' },
    take: 80,
  })

  const guardedPosts = posts.map(post => {
    const result = evaluateBlogPublishGuard({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      contentMd: post.contentMd,
      blocks: post.blocks,
      coverImageUrl: post.coverImageUrl,
      categoryId: post.categoryId,
      tags: post.tags,
      isPrivate: post.isPrivate,
      isSponsored: post.isSponsored,
      adsDisabled: post.adsDisabled,
      relatedCounts: {
        artists: post._count.relatedArtists,
        groups: post._count.relatedGroups,
        productions: post._count.relatedProductions,
      },
    })
    return { id: post.id, slug: post.slug, title: post.title, status: post.status, ...result }
  })

  const [
    artistsThin,
    groupsThin,
    productionsAdult,
    blogMissingCover,
    blogWithoutLinks,
    seoNoIndex,
    server5xx,
  ] = await Promise.all([
    prisma.artist.count({ where: { isHidden: false, slug: { not: null }, primaryImageUrl: null, OR: [{ bio: null }, { bio: '' }] } }),
    prisma.musicalGroup.count({ where: { isHidden: false, slug: { not: null }, profileImageUrl: null, OR: [{ bio: null }, { bio: '' }] } }),
    prisma.production.count({ where: { isHidden: false, isTakenDown: false, slug: { not: null }, OR: [{ ageRating: '18' }, { isAdultContent: true }] } }),
    prisma.blogPost.count({ where: { status: 'PUBLISHED', isPrivate: false, coverImageUrl: null } }),
    prisma.blogPost.count({ where: { status: 'PUBLISHED', isPrivate: false, relatedArtists: { none: {} }, relatedGroups: { none: {} }, relatedProductions: { none: {} } } }),
    prisma.seoMeta.count({ where: { noIndex: true } }),
    prisma.serverLog.count({ where: { status: { gte: 500 }, createdAt: { gte: since7d } } }).catch(() => 0),
  ])

  const publishErrors = guardedPosts.reduce((sum, post) => sum + post.issues.filter(issue => issue.severity === 'error').length, 0)
  const publishWarnings = guardedPosts.reduce((sum, post) => sum + post.issues.filter(issue => issue.severity === 'warning').length, 0)
  const openIssues = artistsThin + groupsThin + productionsAdult + blogMissingCover + blogWithoutLinks + publishErrors + server5xx
  const score = Math.max(0, 100 - openIssues * 2 - publishWarnings)

  return {
    generatedAt: new Date().toISOString(),
    score,
    summary: {
      openIssues,
      publishErrors,
      publishWarnings,
      recent404: recent404.reduce((sum, row) => sum + row._count.path, 0),
      server5xx,
    },
    wordpressGrade: {
      urlHealth: true,
      publishGuard: true,
      redirectsAnd404: true,
      imageAudit: true,
      adsGovernance: true,
      cacheObservability: true,
    },
    inventory: {
      thinArtists: artistsThin,
      thinGroups: groupsThin,
      adultProductions: productionsAdult,
      blogMissingCover,
      blogWithoutLinks,
      seoNoIndex,
    },
    top404: recent404.map(row => ({ path: row.path, count: row._count.path })),
    publishGuard: guardedPosts
      .filter(post => post.issues.length > 0)
      .sort((a, b) => a.score - b.score)
      .slice(0, 20)
      .map(post => ({
        id: post.id,
        slug: post.slug,
        title: post.title,
        status: post.status,
        score: post.score,
        publishable: post.publishable,
        issues: post.issues.slice(0, 5),
      })),
    checks: [
      check('url-health', 'URL Health', 'ok', 'Auditoria por URL disponível para blog, artistas, grupos e produções.', '/admin/site-health'),
      check('publish-guard', 'Publish guard', publishErrors ? 'error' : publishWarnings ? 'warning' : 'ok', publishErrors ? `${publishErrors} erro(s) bloqueantes em posts.` : `${publishWarnings} aviso(s) editoriais.`, '/admin/blog'),
      check('redirects-404', '404 monitor', recent404.length ? 'warning' : 'ok', recent404.length ? `${recent404.length} URLs com 404 nos últimos 7 dias.` : 'Sem 404 recente persistido.', '/admin/server-logs?status=4xx'),
      check('images', 'Imagens', blogMissingCover ? 'warning' : 'ok', blogMissingCover ? `${blogMissingCover} post(s) publicados sem capa.` : 'Capas de blog ok.', '/admin/image-audit'),
      check('ads', 'AdSense governance', 'ok', 'Ads bloqueados para patrocinado/thin/noindex/adulto e canais granulares ativos.', '/admin/ads'),
      check('cache', 'Cache observability', server5xx ? 'warning' : 'ok', server5xx ? `${server5xx} erro(s) 5xx recentes podem indicar rota/cache instável.` : 'Sem 5xx recente persistido.', '/admin/server-logs?status=5xx'),
    ],
  }
}
