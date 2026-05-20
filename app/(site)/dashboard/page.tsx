import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  BookmarkCheck,
  CalendarDays,
  ChevronRight,
  Clock,
  Compass,
  Film,
  Heart,
  History,
  LayoutDashboard,
  MessageCircle,
  Music,
  Play,
  Settings,
  Shield,
  Star,
  TrendingUp,
  User,
  type LucideIcon,
} from 'lucide-react'
import { PageTransition } from '@/components/features/PageTransition'
import { getDashboardData } from '@/lib/actions/user'
import { SafeImage } from '@/components/ui/SafeImage'

interface Activity {
  id: string
  type: string
  entityId: string | null
  entityType: string | null
  entityName?: string
  createdAt: string
}

interface BlogPostItem {
  id: string
  slug: string
  title: string
  excerpt: string | null
  coverImageUrl: string | null
  publishedAt: Date | string | null
  readingTimeMin: number
  category: { name: string; slug: string } | null
  tags: string[]
}

const ACTIVITY_LABELS: Record<string, { label: string; color: string }> = {
  LIKE: { label: 'Favoritou', color: 'text-accent' },
  UNLIKE: { label: 'Removeu', color: 'text-muted' },
  VIEW: { label: 'Visualizou', color: 'text-cyan-500' },
  LOGIN: { label: 'Entrou', color: 'text-green-500' },
}

const ENTITY_HREF: Record<string, (id: string) => string> = {
  ARTIST: id => `/artists/${id}`,
  PRODUCTION: id => `/productions/${id}`,
  GROUP: id => `/groups/${id}`,
}

function PanelTitle({
  icon: Icon,
  title,
  subtitle,
  href,
  linkLabel = 'Ver tudo',
}: {
  icon: LucideIcon
  title: string
  subtitle?: string
  href?: string
  linkLabel?: string
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-background text-accent">
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-black text-foreground">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs leading-5 text-muted">{subtitle}</p>}
        </div>
      </div>
      {href && (
        <Link
          href={href}
          className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-muted transition-colors hover:border-accent/40 hover:text-accent"
        >
          {linkLabel}
          <ChevronRight className="h-3 w-3" />
        </Link>
      )}
    </div>
  )
}

function BlogCard({ post }: { post: BlogPostItem }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group grid min-h-[108px] grid-cols-[104px_minmax(0,1fr)] overflow-hidden rounded-2xl border border-border bg-surface shadow-sm transition-colors hover:border-accent/35"
    >
      <div className="relative h-full min-h-[108px] overflow-hidden bg-background">
        {post.coverImageUrl ? (
          <SafeImage
            src={post.coverImageUrl}
            alt={post.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="120px"
            fallback={
              <div className="flex h-full w-full items-center justify-center bg-surface">
                <Compass className="h-6 w-6 text-muted/45" />
              </div>
            }
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-surface">
            <Compass className="h-6 w-6 text-muted/45" />
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-col justify-center p-3">
        <div className="mb-2 flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.1em] text-muted">
          {post.category && <span className="text-accent">{post.category.name}</span>}
          <span>{post.readingTimeMin} min</span>
        </div>
        <h3 className="line-clamp-3 text-sm font-black leading-tight text-foreground group-hover:text-accent">
          {post.title}
        </h3>
      </div>
    </Link>
  )
}

export default async function DashboardPage() {
  const session = await auth()
  if (!session) redirect('/auth/login?callbackUrl=/dashboard')

  const data = await getDashboardData()
  if (!data) return null

  const { activities, latestBlogPosts, personalizedBlogPosts, hasFollowing, trendingArtists, watchingEntries, stats } = data
  const firstName = session.user.name?.split(' ')[0] ?? 'você'
  const isAdmin = session.user.role?.toLowerCase() === 'admin'
  const blogToShow = (hasFollowing && personalizedBlogPosts.length > 0 ? personalizedBlogPosts : latestBlogPosts) as BlogPostItem[]
  const postsForDashboard = blogToShow.slice(0, 6)
  const daysSinceJoin = stats.joinDate
    ? Math.max(0, Math.floor((Date.now() - new Date(stats.joinDate).getTime()) / 86400000))
    : null
  const isNewUser = activities.length === 0 && watchingEntries.length === 0 && stats.favoritesCount === 0

  const statCards = [
    { label: 'Favoritos', value: stats.favoritesCount, href: '/favorites', icon: Star, tone: 'text-yellow-500 bg-yellow-400/10' },
    { label: 'Minha lista', value: stats.watchlistCount, href: '/watchlist', icon: BookmarkCheck, tone: 'text-teal-500 bg-teal-400/10' },
    { label: 'Comentários', value: stats.commentsCount, href: '/profile', icon: MessageCircle, tone: 'text-pink-500 bg-pink-400/10' },
    ...(daysSinceJoin !== null
      ? [{ label: 'Dias no Hub', value: daysSinceJoin, href: '/profile', icon: CalendarDays, tone: 'text-accent bg-accent-soft' }]
      : []),
  ]

  const nextActions = [
    { label: 'Organizar biblioteca', detail: `${stats.watchlistCount} produção${stats.watchlistCount === 1 ? '' : 'ões'} salvas`, href: '/watchlist', icon: BookmarkCheck },
    { label: 'Revisar preferências', detail: 'Alertas, conteúdo e conta', href: '/settings', icon: Settings },
    { label: 'Explorar novidades', detail: 'Artistas, grupos e artigos', href: '/', icon: Compass },
    ...(isAdmin ? [{ label: 'Painel admin', detail: 'Gestão do sistema', href: '/admin', icon: Shield }] : []),
  ]

  return (
    <PageTransition>
      <main className="mx-auto max-w-7xl px-4 pb-12 pt-4 sm:px-6 lg:px-8">
        <header className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
          <div className="grid gap-0 xl:grid-cols-[minmax(0,0.95fr)_minmax(360px,0.8fr)_280px]">
            <section className="p-5 sm:p-6">
                <div className="mb-4 flex items-center gap-3">
                  {session.user.image ? (
                    <div className="relative h-12 w-12 overflow-hidden rounded-2xl border border-border bg-background">
                      <Image src={session.user.image} alt={session.user.name ?? ''} fill className="object-cover" sizes="48px" />
                    </div>
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-lg font-black text-white">
                      {session.user.name?.charAt(0).toUpperCase() ?? '?'}
                    </div>
                  )}
                  <div>
                    <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-accent">
                      <LayoutDashboard className="h-3 w-3" />
                      Painel
                    </p>
                    <h1 className="mt-1 text-3xl font-black tracking-tight text-foreground">
                      Olá, {firstName}
                    </h1>
                  </div>
                </div>
                <p className="max-w-2xl text-sm leading-5 text-muted">
                  Resumo da sua atividade, recomendações e próximos passos no HallyuHub.
                </p>
            </section>

            <section className="border-t border-border p-4 sm:p-5 xl:border-l xl:border-t-0">
              <div className="grid grid-cols-2 gap-2">
                  {statCards.map(({ label, value, href, icon: Icon, tone }) => (
                    <Link key={label} href={href} className="flex items-center gap-3 rounded-2xl border border-border bg-background p-3 transition-colors hover:border-accent/40">
                      <span className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${tone}`}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-xl font-black leading-none text-foreground">{value.toLocaleString('pt-BR')}</span>
                        <span className="mt-1 block truncate text-[10px] font-black uppercase tracking-[0.1em] text-muted">{label}</span>
                      </span>
                    </Link>
                  ))}
                </div>
            </section>

            <section className="border-t border-border bg-background p-4 sm:p-5 xl:border-l xl:border-t-0">
              <p className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-muted">Ações rápidas</p>
              <div className="grid gap-1.5">
                {nextActions.slice(0, 3).map(({ label, detail, href, icon: Icon }) => (
                  <Link key={href} href={href} className="group flex items-center gap-2.5 rounded-xl px-2.5 py-2 transition-colors hover:bg-surface">
                    <Icon className="h-4 w-4 flex-shrink-0 text-muted group-hover:text-accent" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-black text-foreground">{label}</span>
                      <span className="block truncate text-[11px] text-muted">{detail}</span>
                    </span>
                    <ChevronRight className="h-3.5 w-3.5 text-muted" />
                  </Link>
                ))}
              </div>
            </section>
          </div>
        </header>

        {isNewUser ? (
          <section className="mt-5 rounded-2xl border border-border bg-surface p-7 text-center shadow-sm sm:p-10">
            <Compass className="mx-auto mb-4 h-10 w-10 text-accent" />
            <h2 className="text-2xl font-black text-foreground">Monte seu HallyuHub</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted">
              Favorite artistas, salve produções e acompanhe artigos para transformar este painel em uma central realmente personalizada.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href="/artists" className="btn-primary inline-flex items-center gap-2"><User className="h-4 w-4" /> Explorar artistas</Link>
              <Link href="/productions" className="btn-secondary inline-flex items-center gap-2"><Film className="h-4 w-4" /> Ver produções</Link>
            </div>
          </section>
        ) : (
          <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="space-y-5">
              {watchingEntries.length > 0 && (
                <section className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
                  <PanelTitle icon={Play} title="Continue assistindo" subtitle="Sua lista em andamento." href="/watchlist?status=WATCHING" linkLabel="Lista" />
                  <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                    {watchingEntries.map((entry: any) => (
                      <Link key={entry.productionId} href={`/productions/${entry.production.slug ?? entry.production.id}`} className="group">
                        <div className="relative aspect-[5/7] overflow-hidden rounded-2xl border border-border bg-background">
                          {entry.production.imageUrl ? (
                            <Image src={entry.production.imageUrl} alt={entry.production.titlePt} fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="160px" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-muted"><Film className="h-6 w-6" /></div>
                          )}
                          <span className="absolute bottom-2 left-2 flex h-7 w-7 items-center justify-center rounded-full bg-foreground text-background">
                            <Play className="h-3 w-3 fill-current" />
                          </span>
                        </div>
                        <p className="mt-2 line-clamp-2 text-xs font-bold leading-tight text-muted group-hover:text-foreground">{entry.production.titlePt}</p>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {blogToShow.length > 0 && (
                <section>
                  <PanelTitle
                    icon={Compass}
                    title={hasFollowing && personalizedBlogPosts.length > 0 ? 'Leituras para você' : 'Leituras recentes'}
                    subtitle={hasFollowing && personalizedBlogPosts.length > 0 ? 'Selecionadas a partir do que você favoritou.' : 'Novidades editoriais para acompanhar.'}
                    href="/blog"
                    linkLabel="Blog"
                  />
                  <div className="grid gap-3 md:grid-cols-2">
                    {postsForDashboard.map(post => <BlogCard key={post.id} post={post} />)}
                  </div>
                </section>
              )}
            </div>

            <aside className="space-y-5">
              {trendingArtists.length > 0 && (
                <section className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
                  <PanelTitle icon={TrendingUp} title="Em alta" subtitle="Artistas para explorar." href="/artists" linkLabel="Artistas" />
                  <div className="grid grid-cols-3 gap-3">
                    {trendingArtists.slice(0, 6).map((artist: any) => (
                      <Link key={artist.id} href={`/artists/${artist.id}`} className="group min-w-0 text-center">
                        <div className="relative mx-auto h-16 w-16 overflow-hidden rounded-2xl border border-border bg-background transition-colors group-hover:border-accent/50">
                          {artist.primaryImageUrl ? (
                            <Image src={artist.primaryImageUrl} alt={artist.nameRomanized} fill className="object-cover object-top transition-transform duration-500 group-hover:scale-105" sizes="64px" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center font-black text-foreground">{artist.nameRomanized[0]}</div>
                          )}
                        </div>
                        <p className="mt-2 line-clamp-2 text-[11px] font-bold leading-tight text-muted group-hover:text-foreground">{artist.nameRomanized}</p>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              <section className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
                <PanelTitle icon={History} title="Atividade recente" subtitle="Seu histórico mais novo." href="/profile" linkLabel="Perfil" />
                <div className="space-y-1.5">
                  {activities.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border bg-background p-5 text-center text-xs text-muted">
                      <Clock className="mx-auto mb-2 h-5 w-5" />
                      Sem atividade recente.
                    </div>
                  ) : (
                    (activities as Activity[]).slice(0, 6).map(activity => {
                      const config = ACTIVITY_LABELS[activity.type] ?? { label: activity.type, color: 'text-muted' }
                      const href = activity.entityId && activity.entityType ? ENTITY_HREF[activity.entityType]?.(activity.entityId) : null
                      const content = (
                        <div className="flex items-center gap-3 rounded-xl border border-border bg-background px-3 py-2.5">
                          <span className={`w-20 flex-shrink-0 text-[10px] font-black uppercase tracking-[0.1em] ${config.color}`}>{config.label}</span>
                          <span className="min-w-0 flex-1 truncate text-xs font-bold text-foreground">{activity.entityName ?? activity.entityType?.toLowerCase() ?? 'sistema'}</span>
                          <span className="text-[10px] text-muted">{new Date(activity.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
                        </div>
                      )
                      return href ? <Link key={activity.id} href={href}>{content}</Link> : <div key={activity.id}>{content}</div>
                    })
                  )}
                </div>
              </section>

              <section className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
                <p className="mb-3 text-[10px] font-black uppercase tracking-[0.16em] text-muted">Explorar</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { href: '/artists', label: 'Artistas', icon: User },
                    { href: '/groups', label: 'Grupos', icon: Music },
                    { href: '/productions', label: 'Produções', icon: Film },
                    { href: '/favorites', label: 'Favoritos', icon: Heart },
                  ].map(({ href, label, icon: Icon }) => (
                    <Link key={href} href={href} className="flex items-center gap-2 rounded-2xl border border-border bg-background px-3 py-3 text-xs font-black text-foreground transition-colors hover:border-accent/40 hover:text-accent">
                      <Icon className="h-4 w-4 text-muted" />
                      {label}
                    </Link>
                  ))}
                </div>
              </section>
            </aside>
          </div>
        )}
      </main>
    </PageTransition>
  )
}
