import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  User, Mail, Shield, Calendar, Heart, MessageSquare,
  Film, Newspaper, Star, Settings, ChevronRight,
  Trophy, Clock, LayoutDashboard, BookmarkCheck,
} from 'lucide-react'
import { PageTransition } from '@/components/features/PageTransition'
import { getProfileData } from '@/lib/actions/user'
import { FavoritesGallery } from '@/components/dashboard/FavoritesGallery'
import { EditProfileForm } from '@/components/profile/EditProfileForm'

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserStats {
  favoriteArtists: number
  favoriteProductions: number
  favoriteNews: number
  totalComments: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getRoleBadge(role: string) {
  switch (role?.toLowerCase()) {
    case 'admin':  return { label: 'Administrador', color: 'bg-red-500/20 text-red-400 border-red-500/30' }
    case 'editor': return { label: 'Editor',        color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' }
    default:       return { label: 'Membro',        color: 'bg-cyber-purple/20 text-cyber-purple border-cyber-purple/30' }
  }
}

function getAchievements(stats: UserStats) {
  const achievements: { icon: string; label: string; desc: string }[] = []
  if (stats.totalComments >= 1)  achievements.push({ icon: '💬', label: 'Comentarista', desc: 'Fez seu primeiro comentário' })
  if (stats.totalComments >= 10) achievements.push({ icon: '🗣️', label: 'Ativo',        desc: '10+ comentários' })
  if (stats.favoriteArtists >= 5) achievements.push({ icon: '⭐', label: 'Fã de K-Pop', desc: '5+ artistas favoritos' })
  if (stats.favoriteProductions >= 5) achievements.push({ icon: '🎬', label: 'Cinéfilo', desc: '5+ produções favoritas' })
  if (stats.favoriteArtists + stats.favoriteProductions + stats.favoriteNews >= 20)
    achievements.push({ icon: '🏆', label: 'Colecionador', desc: '20+ itens favoritos' })
  return achievements
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ProfilePage() {
  const session = await auth()
  if (!session) redirect('/auth/login?callbackUrl=/profile')

  const data = await getProfileData()
  if (!data) return null

  const { stats, recentComments, recentFavoriteArtists, recentFavoriteProductions, memberSince, heroImageUrl, trendingArtists, bio } = data

  const roleBadge = getRoleBadge(session.user.role ?? '')
  const achievements = getAchievements(stats)
  const memberSinceFormatted = memberSince
    ? new Date(memberSince).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    : null

  const miniStats = [
    { label: 'Artistas',   value: stats.favoriteArtists,    icon: Star,          color: 'text-cyber-purple', bg: 'bg-cyber-purple/10' },
    { label: 'Produções',  value: stats.favoriteProductions, icon: Film,          color: 'text-neon-pink',   bg: 'bg-pink-400/10' },
    { label: 'Notícias',   value: stats.favoriteNews,        icon: Newspaper,     color: 'text-neon-cyan',   bg: 'bg-cyan-400/10' },
    { label: 'Comentários',value: stats.totalComments,       icon: MessageSquare, color: 'text-green-400',   bg: 'bg-green-400/10' },
  ]

  const isEmpty = recentFavoriteArtists.length === 0 && recentFavoriteProductions.length === 0 && recentComments.length === 0

  return (
    <PageTransition>
      <div className="min-h-screen pb-20">

        {/* ── Hero Banner ─────────────────────────────────────────────────────── */}
        <div className="relative w-full h-52 md:h-72 overflow-hidden">
          {heroImageUrl ? (
            <Image
              src={heroImageUrl}
              alt="Profile hero"
              fill
              className="object-cover object-center blur-sm brightness-30"
              sizes="100vw"
              priority
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-br from-cyber-purple/40 via-black/60 to-neon-pink/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-24 relative z-10 space-y-6">

          {/* ── Profile Header ──────────────────────────────────────────────── */}
          <div className="glass-card p-6 md:p-8">
            <div className="flex flex-col md:flex-row gap-6 items-center md:items-end">

              {/* Avatar */}
              <div className="relative flex-shrink-0">
                {session.user.image ? (
                  <div className="relative w-28 h-28 md:w-32 md:h-32 rounded-2xl overflow-hidden border-4 border-cyber-purple shadow-2xl shadow-purple-900/50">
                    <Image
                      src={session.user.image}
                      alt={session.user.name ?? 'User'}
                      fill
                      className="object-cover"
                      sizes="128px"
                    />
                  </div>
                ) : (
                  <div className="w-28 h-28 md:w-32 md:h-32 rounded-2xl bg-gradient-to-br from-cyber-purple to-neon-pink flex items-center justify-center border-4 border-cyber-purple shadow-2xl shadow-purple-900/50">
                    <span className="text-5xl font-black text-white">
                      {session.user.name?.charAt(0).toUpperCase() ?? '?'}
                    </span>
                  </div>
                )}
                <div className="absolute -bottom-2 -right-2 w-5 h-5 bg-green-500 rounded-full border-2 border-zinc-900" />
              </div>

              {/* Info */}
              <div className="flex-1 text-center md:text-left">
                <p className="text-neon-pink font-black tracking-widest uppercase text-[10px] mb-1">Perfil</p>
                <h1 className="text-3xl md:text-4xl font-display font-black text-white tracking-tight leading-none mb-3">
                  {session.user.name}
                </h1>
                <div className="flex flex-wrap items-center gap-2 justify-center md:justify-start mb-2">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border ${roleBadge.color}`}>
                    <Shield size={12} />
                    {roleBadge.label}
                  </span>
                  {memberSinceFormatted && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs text-zinc-400 bg-zinc-800 border border-white/5">
                      <Calendar size={12} />
                      Membro desde {memberSinceFormatted}
                    </span>
                  )}
                </div>
                <p className="text-zinc-500 text-sm flex items-center gap-1.5 justify-center md:justify-start">
                  <Mail size={14} />
                  {session.user.email}
                </p>
                {bio && (
                  <p className="text-zinc-400 text-sm mt-2 max-w-md">{bio}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 flex-shrink-0">
                <EditProfileForm name={session.user.name ?? null} bio={bio} />
                <Link
                  href="/settings"
                  className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-xl transition-colors border border-white/10 uppercase tracking-widest"
                >
                  <Settings size={16} />
                  <span className="hidden sm:inline">Config.</span>
                </Link>
                {(session.user.role?.toLowerCase() === 'admin' || session.user.role?.toLowerCase() === 'editor') && (
                  <Link
                    href="/admin"
                    className="flex items-center gap-2 px-4 py-2.5 bg-cyber-purple/80 hover:bg-cyber-purple text-white text-xs font-bold rounded-xl transition-colors uppercase tracking-widest"
                  >
                    <LayoutDashboard size={16} />
                    <span className="hidden sm:inline">Admin</span>
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* ── Mini Stats ──────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {miniStats.map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className="glass-card p-4 flex items-center gap-3 rounded-xl border border-white/5">
                <div className={`p-2 rounded-lg ${bg} ${color}`}>
                  <Icon size={16} />
                </div>
                <div>
                  <p className="text-xl font-black text-white leading-none">{value.toLocaleString('pt-BR')}</p>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider mt-0.5">{label}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* ── Left Column ─────────────────────────────────────────────── */}
            <div className="lg:col-span-2 space-y-6">

              {/* Artistas Favoritos */}
              {recentFavoriteArtists.length > 0 && (
                <section className="glass-card p-6">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-cyber-purple/20 rounded-lg">
                        <Star size={16} className="text-cyber-purple" />
                      </div>
                      <div>
                        <h2 className="text-xl font-display font-black text-white uppercase italic tracking-tight">Artistas Favoritos</h2>
                        <p className="text-xs text-zinc-500">Seus artistas recentes</p>
                      </div>
                    </div>
                    <Link href="/favorites" className="text-xs font-black text-zinc-500 hover:text-white uppercase tracking-widest transition-colors flex items-center gap-2">
                      Ver todos <ChevronRight size={14} />
                    </Link>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                    {recentFavoriteArtists.map((artist) => (
                      <Link key={artist.id} href={`/artists/${artist.id}`} className="group text-center">
                        <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-zinc-800 mb-2 border border-white/10 group-hover:border-cyber-purple/60 transition-all">
                          {artist.primaryImageUrl ? (
                            <Image
                              src={artist.primaryImageUrl}
                              alt={artist.nameRomanized}
                              fill
                              className="object-cover group-hover:scale-110 transition-transform duration-500"
                              sizes="(max-width: 640px) 33vw, 10vw"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-cyber-purple/30 to-neon-pink/30">
                              <User className="w-8 h-8 text-zinc-600" />
                            </div>
                          )}
                        </div>
                        <p className="text-[10px] text-zinc-400 group-hover:text-white font-bold truncate transition-colors">
                          {artist.nameRomanized}
                        </p>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* Produções Favoritas */}
              {recentFavoriteProductions.length > 0 && (
                <section className="glass-card p-6">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-neon-pink/10 rounded-lg">
                        <Film size={16} className="text-neon-pink" />
                      </div>
                      <div>
                        <h2 className="text-xl font-display font-black text-white uppercase italic tracking-tight">Produções Salvas</h2>
                        <p className="text-xs text-zinc-500">Na sua lista de favoritos</p>
                      </div>
                    </div>
                    <Link href="/favorites" className="text-xs font-black text-zinc-500 hover:text-white uppercase tracking-widest transition-colors flex items-center gap-2">
                      Ver todas <ChevronRight size={14} />
                    </Link>
                  </div>
                  <div className="space-y-3">
                    {recentFavoriteProductions.map((prod) => (
                      <Link
                        key={prod.id}
                        href={`/productions/${prod.id}`}
                        className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/15 transition-all group"
                      >
                        <div className="relative w-12 h-16 rounded-lg overflow-hidden bg-zinc-800 flex-shrink-0">
                          {prod.imageUrl ? (
                            <Image src={prod.imageUrl} alt={prod.titlePt} fill className="object-cover" sizes="48px" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Film className="w-5 h-5 text-zinc-600" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-white group-hover:text-neon-cyan transition-colors truncate">
                            {prod.titlePt}
                          </p>
                          <p className="text-xs text-zinc-500">
                            {prod.type}{prod.year ? ` · ${prod.year}` : ''}
                          </p>
                          {prod.voteAverage ? (
                            <div className="flex items-center gap-1 mt-1">
                              <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                              <span className="text-xs text-yellow-400">{prod.voteAverage.toFixed(1)}</span>
                            </div>
                          ) : null}
                        </div>
                        <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors flex-shrink-0" />
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* Comentários Recentes */}
              {recentComments.length > 0 && (
                <section className="glass-card p-6">
                  <div className="flex items-center gap-2 mb-5">
                    <div className="p-1.5 bg-green-500/10 rounded-lg">
                      <MessageSquare size={16} className="text-green-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-display font-black text-white uppercase italic tracking-tight">Comentários Recentes</h2>
                      <p className="text-xs text-zinc-500">Suas últimas interações</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {recentComments.map((comment) => (
                      <Link
                        key={comment.id}
                        href={`/news/${comment.news.id}`}
                        className="block p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/15 transition-all group"
                      >
                        <p className="text-sm text-zinc-300 line-clamp-2 mb-2 group-hover:text-white transition-colors">
                          &ldquo;{comment.content}&rdquo;
                        </p>
                        <div className="flex items-center gap-2">
                          <Newspaper className="w-3 h-3 text-zinc-600" />
                          <p className="text-xs text-zinc-500 truncate group-hover:text-zinc-400 transition-colors">
                            {comment.news.title}
                          </p>
                          <span className="ml-auto text-xs text-zinc-600 flex-shrink-0 flex items-center gap-1">
                            <Clock size={10} />
                            {new Date(comment.createdAt).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* Empty State */}
              {isEmpty && (
                <div className="glass-card p-12 text-center">
                  <Heart className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                  <h3 className="text-xl font-display font-black text-white uppercase italic tracking-tight mb-2">Comece sua jornada!</h3>
                  <p className="text-sm text-zinc-500 mb-6 max-w-sm mx-auto">
                    Favorite artistas, salve produções e comente nas notícias para ver sua atividade aqui.
                  </p>
                  <div className="flex gap-3 justify-center">
                    <Link href="/artists" className="btn-primary text-xs uppercase tracking-widest">Explorar Artistas</Link>
                    <Link href="/news" className="btn-secondary text-xs uppercase tracking-widest">Ver Notícias</Link>
                  </div>
                </div>
              )}
            </div>

            {/* ── Right Column ────────────────────────────────────────────── */}
            <div className="space-y-4">

              {/* Conquistas */}
              <section className="glass-card p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-1.5 bg-yellow-500/10 rounded-lg">
                    <Trophy size={16} className="text-yellow-400" />
                  </div>
                  <h2 className="text-xl font-display font-black text-white uppercase italic tracking-tight">Conquistas</h2>
                </div>
                {achievements.length > 0 ? (
                  <div className="space-y-3">
                    {achievements.map((a, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-yellow-500/5 border border-yellow-500/20">
                        <span className="text-2xl">{a.icon}</span>
                        <div>
                          <p className="text-sm font-bold text-yellow-400">{a.label}</p>
                          <p className="text-xs text-zinc-500">{a.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-600 text-center py-4">
                    Interaja com o site para desbloquear conquistas!
                  </p>
                )}
              </section>

              {/* Links Rápidos */}
              <section className="glass-card p-6">
                <h2 className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-3">Navegação</h2>
                <div className="space-y-1">
                  {[
                    { href: '/favorites',  icon: Heart,          label: 'Meus Favoritos', color: 'text-neon-pink' },
                    { href: '/watchlist',  icon: BookmarkCheck,  label: 'Minha Lista',    color: 'text-teal-400' },
                    { href: '/dashboard',  icon: LayoutDashboard,label: 'Dashboard',      color: 'text-cyber-purple' },
                    { href: '/settings',   icon: Settings,        label: 'Configurações', color: 'text-zinc-400' },
                  ].map(({ href, icon: Icon, label, color }) => (
                    <Link
                      key={href}
                      href={href}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors group"
                    >
                      <Icon className={`w-4 h-4 ${color}`} />
                      <span className="text-sm text-zinc-400 group-hover:text-white transition-colors font-bold">{label}</span>
                      <ChevronRight className="w-4 h-4 text-zinc-700 group-hover:text-zinc-500 ml-auto transition-colors" />
                    </Link>
                  ))}
                </div>
              </section>

            </div>
          </div>

          {/* ── Minha Coleção ───────────────────────────────────────────── */}
          <section>
            <div className="flex justify-between items-end mb-4">
              <div>
                <h2 className="text-2xl font-display font-black text-white uppercase italic tracking-tight">Minha Coleção</h2>
                <p className="text-zinc-500 text-sm mt-1">Todos os seus itens favoritos</p>
              </div>
              <Link href="/favorites" className="text-xs font-black text-zinc-500 hover:text-white uppercase tracking-widest transition-colors flex items-center gap-2">
                Ver Tudo <ChevronRight size={14} />
              </Link>
            </div>
            <FavoritesGallery trendingArtists={trendingArtists} />
          </section>

        </div>
      </div>
    </PageTransition>
  )
}
