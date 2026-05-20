import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  Calendar,
  ChevronRight,
  Film,
  Heart,
  LayoutDashboard,
  MessageSquare,
  Newspaper,
  Settings,
  Shield,
  Sparkles,
  Star,
  Trophy,
  User,
  type LucideIcon,
} from 'lucide-react'
import { PageTransition } from '@/components/features/PageTransition'
import { getProfileData } from '@/lib/actions/user'
import { EditProfileForm } from '@/components/profile/EditProfileForm'

interface UserStats {
  favoriteArtists: number
  favoriteProductions: number
  favoriteNews: number
  totalComments: number
}

function getRoleBadge(role: string) {
  switch (role?.toLowerCase()) {
    case 'admin':
      return { label: 'Administrador', color: 'border-red-500/25 bg-red-500/10 text-red-500' }
    case 'editor':
      return { label: 'Editor', color: 'border-blue-500/25 bg-blue-500/10 text-blue-500' }
    default:
      return { label: 'Membro', color: 'border-accent/20 bg-accent-soft text-accent' }
  }
}

function getAchievements(stats: UserStats): Array<{ icon: LucideIcon; label: string; desc: string }> {
  const achievements: Array<{ icon: LucideIcon; label: string; desc: string }> = []
  if (stats.totalComments >= 1) achievements.push({ icon: MessageSquare, label: 'Comentarista', desc: 'Participou das conversas.' })
  if (stats.favoriteArtists >= 5) achievements.push({ icon: Star, label: 'Curadoria K-Pop', desc: '5+ artistas favoritos.' })
  if (stats.favoriteProductions >= 5) achievements.push({ icon: Film, label: 'Radar de dramas', desc: '5+ produções salvas.' })
  if (stats.favoriteArtists + stats.favoriteProductions + stats.favoriteNews >= 20) {
    achievements.push({ icon: Trophy, label: 'Colecionador', desc: '20+ itens na coleção.' })
  }
  return achievements
}

function SectionHeader({
  title,
  subtitle,
  href,
  linkLabel = 'Ver tudo',
}: {
  title: string
  subtitle?: string
  href?: string
  linkLabel?: string
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div>
        <h2 className="text-lg font-black tracking-tight text-foreground">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs leading-5 text-muted">{subtitle}</p>}
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

export default async function ProfilePage() {
  const session = await auth()
  if (!session) redirect('/auth/login?callbackUrl=/profile')

  const data = await getProfileData()
  if (!data) return null

  const {
    stats,
    recentComments,
    recentFavoriteArtists,
    recentFavoriteProductions,
    memberSince,
    trendingArtists,
    bio,
    heroImageUrl,
  } = data

  const roleBadge = getRoleBadge(session.user.role ?? '')
  const achievements = getAchievements(stats)
  const memberSinceFormatted = memberSince
    ? new Date(memberSince).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    : null
  const totalCollection = stats.favoriteArtists + stats.favoriteProductions + stats.favoriteNews
  const isEmpty = totalCollection === 0 && recentComments.length === 0

  const collectionStats = [
    { label: 'Artistas', value: stats.favoriteArtists, icon: Star },
    { label: 'Produções', value: stats.favoriteProductions, icon: Film },
    { label: 'Notícias', value: stats.favoriteNews, icon: Newspaper },
    { label: 'Comentários', value: stats.totalComments, icon: MessageSquare },
  ]

  return (
    <PageTransition>
      <main className="min-h-screen pb-16">
        <section className="relative overflow-hidden border-b border-border bg-foreground text-background">
          <div className="absolute inset-0 opacity-35">
            {heroImageUrl ? (
              <Image src={heroImageUrl} alt="" fill className="object-cover object-top" sizes="100vw" priority />
            ) : (
              <div className="h-full w-full bg-[radial-gradient(circle_at_20%_20%,rgba(255,45,120,0.55),transparent_34%),linear-gradient(135deg,#161616,#050505)]" />
            )}
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/72 to-black/35" />

          <div className="relative mx-auto grid max-w-7xl gap-5 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:px-8 lg:py-8">
            <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative flex-shrink-0">
                {session.user.image ? (
                  <div className="relative h-24 w-24 overflow-hidden rounded-3xl border border-white/15 bg-white/10 shadow-2xl sm:h-28 sm:w-28">
                    <Image src={session.user.image} alt={session.user.name ?? 'Perfil'} fill className="object-cover" sizes="112px" />
                  </div>
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-accent text-4xl font-black text-white shadow-2xl sm:h-28 sm:w-28">
                    {session.user.name?.charAt(0).toUpperCase() ?? '?'}
                  </div>
                )}
                <span className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full border-4 border-foreground bg-green-500" />
              </div>

              <div className="min-w-0">
                <p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-white/60">Perfil público</p>
                <h1 className="max-w-3xl text-3xl font-black tracking-tight text-white sm:text-4xl">
                  {session.user.name}
                </h1>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-black ${roleBadge.color}`}>
                    <Shield className="h-3.5 w-3.5" />
                    {roleBadge.label}
                  </span>
                  {memberSinceFormatted && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-white/75">
                      <Calendar className="h-3.5 w-3.5" />
                      Desde {memberSinceFormatted}
                    </span>
                  )}
                </div>
                <p className="mt-3 max-w-2xl text-sm leading-5 text-white/72">
                  {bio ?? 'Perfil em construção. Adicione uma bio curta para apresentar sua curadoria, seus interesses e seu jeito de acompanhar o universo Hallyu.'}
                </p>
              </div>
            </div>

            <aside className="self-center rounded-3xl border border-white/12 bg-white/10 p-3 backdrop-blur">
              <div className="grid grid-cols-2 gap-2">
                {collectionStats.map(({ label, value, icon: Icon }) => (
                  <div key={label} className="rounded-2xl bg-white/10 p-3">
                    <Icon className="mb-2 h-4 w-4 text-white/65" />
                    <p className="text-xl font-black leading-none text-white">{value.toLocaleString('pt-BR')}</p>
                    <p className="mt-1 truncate text-[9px] font-black uppercase tracking-[0.12em] text-white/55">{label}</p>
                  </div>
                ))}
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <EditProfileForm name={session.user.name ?? null} bio={bio} />
                <Link href="/settings" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-white transition-colors hover:bg-white/15">
                  <Settings className="h-3.5 w-3.5" />
                  Ajustes
                </Link>
                {(session.user.role?.toLowerCase() === 'admin' || session.user.role?.toLowerCase() === 'editor') && (
                  <Link href="/admin" className="col-span-2 inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-foreground transition-colors hover:bg-accent hover:text-white">
                    <LayoutDashboard className="h-3.5 w-3.5" />
                    Admin
                  </Link>
                )}
              </div>
            </aside>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          {isEmpty ? (
            <section className="rounded-3xl border border-border bg-surface p-8 text-center shadow-sm">
              <Sparkles className="mx-auto mb-4 h-10 w-10 text-accent" />
              <h2 className="text-2xl font-black text-foreground">Este perfil ainda está ganhando forma</h2>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted">
                Favorite artistas, salve produções e participe dos comentários para criar uma vitrine pública mais interessante.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link href="/artists" className="btn-primary">Explorar artistas</Link>
                <Link href="/productions" className="btn-secondary">Ver produções</Link>
              </div>
            </section>
          ) : (
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
              <div className="space-y-5">
                <section>
                  <SectionHeader title="Curadoria de artistas" subtitle="Os rostos que melhor representam este perfil." href="/favorites" />
                  <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                    {(recentFavoriteArtists.length > 0 ? recentFavoriteArtists : trendingArtists).slice(0, 6).map((artist: any) => (
                      <Link key={artist.id} href={`/artists/${artist.id}`} className="group overflow-hidden rounded-2xl border border-border bg-surface shadow-sm transition-colors hover:border-accent/40">
                        <div className="relative aspect-square bg-background">
                          {artist.primaryImageUrl ? (
                            <Image src={artist.primaryImageUrl} alt={artist.nameRomanized} fill className="object-cover object-top transition-transform duration-500 group-hover:scale-105" sizes="180px" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-2xl font-black text-foreground">{artist.nameRomanized[0]}</div>
                          )}
                        </div>
                        <div className="p-2.5">
                          <p className="truncate text-xs font-black text-foreground">{artist.nameRomanized}</p>
                          {'nameHangul' in artist && artist.nameHangul && <p className="truncate text-xs text-muted">{artist.nameHangul}</p>}
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>

                {recentFavoriteProductions.length > 0 && (
                  <section>
                    <SectionHeader title="Produções favoritas" subtitle="Dramas e filmes que compõem o gosto público do usuário." href="/favorites" />
                    <div className="grid gap-3 sm:grid-cols-2">
                      {recentFavoriteProductions.map((prod: any) => (
                        <Link key={prod.id} href={`/productions/${prod.slug ?? prod.id}`} className="group grid grid-cols-[72px_minmax(0,1fr)] overflow-hidden rounded-2xl border border-border bg-surface shadow-sm transition-colors hover:border-accent/40">
                          <div className="relative min-h-[104px] bg-background">
                            {prod.imageUrl ? (
                              <Image src={prod.imageUrl} alt={prod.titlePt} fill className="object-cover" sizes="84px" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-muted"><Film className="h-5 w-5" /></div>
                            )}
                          </div>
                          <div className="flex min-w-0 flex-col justify-center p-3">
                            <p className="line-clamp-2 text-sm font-black leading-tight text-foreground group-hover:text-accent">{prod.titlePt}</p>
                            <p className="mt-2 text-xs text-muted">{prod.type}{prod.year ? ` · ${prod.year}` : ''}</p>
                            {prod.voteAverage ? (
                              <p className="mt-3 inline-flex w-fit items-center gap-1 rounded-full bg-yellow-400/10 px-2.5 py-1 text-xs font-black text-yellow-500">
                                <Star className="h-3 w-3 fill-current" />
                                {prod.voteAverage.toFixed(1)}
                              </p>
                            ) : null}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </section>
                )}
              </div>

              <aside className="space-y-5">
                <section className="rounded-3xl border border-border bg-surface p-4 shadow-sm">
                  <SectionHeader title="Marcos" subtitle="Sinais públicos de participação." />
                  {achievements.length > 0 ? (
                    <div className="space-y-3">
                      {achievements.map(({ icon: Icon, label, desc }) => (
                        <div key={label} className="flex items-center gap-3 rounded-2xl border border-border bg-background p-3">
                          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent-soft text-accent">
                            <Icon className="h-4 w-4" />
                          </span>
                          <span>
                            <span className="block text-sm font-black text-foreground">{label}</span>
                            <span className="block text-xs text-muted">{desc}</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="rounded-2xl border border-dashed border-border bg-background p-4 text-sm leading-6 text-muted">
                      Interações futuras aparecem aqui como marcos públicos.
                    </p>
                  )}
                </section>

                {recentComments.length > 0 && (
                  <section className="rounded-3xl border border-border bg-surface p-4 shadow-sm">
                    <SectionHeader title="Voz no site" subtitle="Comentários recentes em artigos." />
                    <div className="space-y-3">
                      {recentComments.slice(0, 4).map(comment => (
                        <Link key={comment.id} href={`/news/${comment.news.id}`} className="block rounded-2xl border border-border bg-background p-3 transition-colors hover:border-accent/40">
                          <p className="line-clamp-2 text-sm leading-5 text-foreground-subtle">&ldquo;{comment.content}&rdquo;</p>
                          <p className="mt-3 truncate text-xs font-bold text-muted">{comment.news.title}</p>
                        </Link>
                      ))}
                    </div>
                  </section>
                )}
              </aside>
            </div>
          )}
        </div>
      </main>
    </PageTransition>
  )
}
