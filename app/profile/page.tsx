'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
    User, Mail, Shield, Calendar, Heart, MessageSquare,
    Film, Newspaper, Star, Settings, ChevronRight,
    Trophy, Clock, LayoutDashboard
} from 'lucide-react'
import { motion } from 'framer-motion'

interface UserStats {
    favoriteArtists: number
    favoriteProductions: number
    favoriteNews: number
    totalComments: number
}

interface RecentComment {
    id: string
    content: string
    createdAt: string
    news: { id: string; title: string; imageUrl: string | null }
}

interface FavoriteArtist {
    id: string
    nameRomanized: string
    nameHangul: string | null
    primaryImageUrl: string | null
    roles: string[]
    favoritedAt: string
}

interface FavoriteProduction {
    id: string
    titlePt: string
    type: string
    year: number | null
    imageUrl: string | null
    voteAverage: number | null
    favoritedAt: string
}

interface ProfileData {
    stats: UserStats
    recentComments: RecentComment[]
    recentFavoriteArtists: FavoriteArtist[]
    recentFavoriteProductions: FavoriteProduction[]
    memberSince: string | null
}

function StatCard({ icon: Icon, label, value, color }: {
    icon: React.ElementType
    label: string
    value: number
    color: string
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6 flex items-center gap-4 hover:border-purple-500/30 transition-all group"
        >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
                <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
                <p className="text-2xl font-black text-white">{value.toLocaleString('pt-BR')}</p>
                <p className="text-xs text-zinc-500 uppercase tracking-wider">{label}</p>
            </div>
        </motion.div>
    )
}

function getRoleBadge(role: string) {
    switch (role?.toLowerCase()) {
        case 'admin': return { label: 'Administrador', color: 'bg-red-500/20 text-red-400 border-red-500/30' }
        case 'editor': return { label: 'Editor', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' }
        default: return { label: 'Membro', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' }
    }
}

function getAchievements(stats: UserStats) {
    const achievements = []
    if (stats.totalComments >= 1) achievements.push({ icon: '💬', label: 'Comentarista', desc: 'Fez seu primeiro comentário' })
    if (stats.totalComments >= 10) achievements.push({ icon: '🗣️', label: 'Ativo', desc: '10+ comentários' })
    if (stats.favoriteArtists >= 5) achievements.push({ icon: '⭐', label: 'Fã de K-Pop', desc: '5+ artistas favoritos' })
    if (stats.favoriteProductions >= 5) achievements.push({ icon: '🎬', label: 'Cinéfilo', desc: '5+ produções favoritas' })
    if (stats.favoriteArtists + stats.favoriteProductions + stats.favoriteNews >= 20)
        achievements.push({ icon: '🏆', label: 'Colecionador', desc: '20+ itens favoritos' })
    return achievements
}

export default function ProfilePage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [data, setData] = useState<ProfileData | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/login?callbackUrl=/profile')
        }
    }, [status, router])

    useEffect(() => {
        if (status !== 'authenticated') return
        fetch('/api/users/stats')
            .then(r => r.json())
            .then(setData)
            .finally(() => setLoading(false))
    }, [status])

    if (status === 'loading' || loading) {
        return (
            <div className="min-h-screen bg-black pt-24 flex items-center justify-center">
                <div className="space-y-4 w-full max-w-4xl px-4">
                    <div className="h-48 bg-zinc-900/50 rounded-2xl animate-pulse" />
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-zinc-900/50 rounded-2xl animate-pulse" />)}
                    </div>
                    <div className="h-64 bg-zinc-900/50 rounded-2xl animate-pulse" />
                </div>
            </div>
        )
    }

    if (!session) return null

    const roleBadge = getRoleBadge(session.user.role ?? '')
    const achievements = data ? getAchievements(data.stats) : []
    const memberSince = data?.memberSince
        ? new Date(data.memberSince).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
        : null

    return (
        <div className="min-h-screen bg-black pb-20">
            {/* Hero Banner */}
            <div className="relative h-48 md:h-64 bg-gradient-to-br from-purple-900/40 via-black to-pink-900/40 overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(168,85,247,0.15),transparent_70%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(236,72,153,0.15),transparent_70%)]" />
            </div>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-20 relative z-10">

                {/* Profile Header Card */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8 mb-6"
                >
                    <div className="flex flex-col md:flex-row gap-6 items-center md:items-end">
                        {/* Avatar */}
                        <div className="relative flex-shrink-0">
                            {session.user.image ? (
                                <img
                                    src={session.user.image}
                                    alt={session.user.name ?? 'User'}
                                    className="w-28 h-28 md:w-32 md:h-32 rounded-2xl border-4 border-purple-500 shadow-2xl shadow-purple-900/50 object-cover"
                                />
                            ) : (
                                <div className="w-28 h-28 md:w-32 md:h-32 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center border-4 border-purple-500 shadow-2xl shadow-purple-900/50">
                                    <span className="text-5xl font-black text-white">
                                        {session.user.name?.charAt(0).toUpperCase() ?? '?'}
                                    </span>
                                </div>
                            )}
                            <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-green-500 rounded-full border-2 border-zinc-900" title="Online" />
                        </div>

                        {/* Info */}
                        <div className="flex-1 text-center md:text-left">
                            <h1 className="text-2xl md:text-3xl font-black text-white mb-1">
                                {session.user.name}
                            </h1>
                            <div className="flex flex-wrap items-center gap-2 justify-center md:justify-start mb-3">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border ${roleBadge.color}`}>
                                    <Shield size={12} />
                                    {roleBadge.label}
                                </span>
                                {memberSince && (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs text-zinc-400 bg-zinc-800 border border-white/5">
                                        <Calendar size={12} />
                                        Membro desde {memberSince}
                                    </span>
                                )}
                            </div>
                            <p className="text-zinc-500 text-sm flex items-center gap-1.5 justify-center md:justify-start">
                                <Mail size={14} />
                                {session.user.email}
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 flex-shrink-0">
                            <Link
                                href="/settings"
                                className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium rounded-xl transition-colors border border-white/10"
                            >
                                <Settings size={16} />
                                <span className="hidden sm:inline">Configurações</span>
                            </Link>
                            {(session.user.role?.toLowerCase() === 'admin' || session.user.role?.toLowerCase() === 'editor') && (
                                <Link
                                    href="/admin"
                                    className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-xl transition-colors"
                                >
                                    <LayoutDashboard size={16} />
                                    <span className="hidden sm:inline">Admin</span>
                                </Link>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* Stats Grid */}
                {data && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <StatCard icon={Star} label="Artistas Favoritos" value={data.stats.favoriteArtists} color="bg-purple-600" />
                        <StatCard icon={Film} label="Produções Salvas" value={data.stats.favoriteProductions} color="bg-pink-600" />
                        <StatCard icon={Newspaper} label="Notícias Salvas" value={data.stats.favoriteNews} color="bg-blue-600" />
                        <StatCard icon={MessageSquare} label="Comentários" value={data.stats.totalComments} color="bg-emerald-600" />
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Left Column */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Artistas Favoritos */}
                        {data && data.recentFavoriteArtists.length > 0 && (
                            <motion.section
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="font-black text-white flex items-center gap-2">
                                        <Star className="w-5 h-5 text-purple-400" />
                                        Artistas Favoritos
                                    </h2>
                                    <Link href="/favorites" className="text-xs text-zinc-500 hover:text-purple-400 flex items-center gap-1 transition-colors">
                                        Ver todos <ChevronRight size={14} />
                                    </Link>
                                </div>
                                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                                    {data.recentFavoriteArtists.map((artist) => (
                                        <Link key={artist.id} href={`/artists/${artist.id}`} className="group text-center">
                                            <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-zinc-800 mb-2">
                                                {artist.primaryImageUrl ? (
                                                    <Image
                                                        src={artist.primaryImageUrl}
                                                        alt={artist.nameRomanized}
                                                        fill
                                                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900 to-pink-900">
                                                        <User className="w-8 h-8 text-purple-400" />
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
                                            </div>
                                            <p className="text-xs text-zinc-300 group-hover:text-white font-medium truncate transition-colors">
                                                {artist.nameRomanized}
                                            </p>
                                        </Link>
                                    ))}
                                </div>
                            </motion.section>
                        )}

                        {/* Produções Favoritas */}
                        {data && data.recentFavoriteProductions.length > 0 && (
                            <motion.section
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="font-black text-white flex items-center gap-2">
                                        <Film className="w-5 h-5 text-pink-400" />
                                        Produções Salvas
                                    </h2>
                                    <Link href="/favorites" className="text-xs text-zinc-500 hover:text-purple-400 flex items-center gap-1 transition-colors">
                                        Ver todas <ChevronRight size={14} />
                                    </Link>
                                </div>
                                <div className="space-y-3">
                                    {data.recentFavoriteProductions.map((prod) => (
                                        <Link key={prod.id} href={`/productions/${prod.id}`} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/15 transition-all group">
                                            <div className="relative w-12 h-16 rounded-lg overflow-hidden bg-zinc-800 flex-shrink-0">
                                                {prod.imageUrl ? (
                                                    <Image src={prod.imageUrl} alt={prod.titlePt} fill className="object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <Film className="w-5 h-5 text-zinc-600" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors truncate">
                                                    {prod.titlePt}
                                                </p>
                                                <p className="text-xs text-zinc-500">
                                                    {prod.type} {prod.year && `• ${prod.year}`}
                                                </p>
                                                {prod.voteAverage && (
                                                    <div className="flex items-center gap-1 mt-1">
                                                        <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                                        <span className="text-xs text-yellow-400">{prod.voteAverage.toFixed(1)}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors flex-shrink-0" />
                                        </Link>
                                    ))}
                                </div>
                            </motion.section>
                        )}

                        {/* Comentários Recentes */}
                        {data && data.recentComments.length > 0 && (
                            <motion.section
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6"
                            >
                                <h2 className="font-black text-white flex items-center gap-2 mb-4">
                                    <MessageSquare className="w-5 h-5 text-emerald-400" />
                                    Comentários Recentes
                                </h2>
                                <div className="space-y-3">
                                    {data.recentComments.map((comment) => (
                                        <Link key={comment.id} href={`/news/${comment.news.id}`} className="block p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/15 transition-all group">
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
                            </motion.section>
                        )}

                        {/* Empty state */}
                        {data && data.recentFavoriteArtists.length === 0 && data.recentFavoriteProductions.length === 0 && data.recentComments.length === 0 && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="bg-zinc-900/50 border border-white/10 rounded-2xl p-12 text-center"
                            >
                                <Heart className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                                <h3 className="text-lg font-bold text-zinc-400 mb-2">Comece a explorar!</h3>
                                <p className="text-sm text-zinc-600 mb-6">Favorite artistas, assista produções e comente nas notícias para ver sua atividade aqui.</p>
                                <div className="flex gap-3 justify-center">
                                    <Link href="/artists" className="btn-gradient px-5 py-2.5 text-sm">Explorar Artistas</Link>
                                    <Link href="/news" className="btn-secondary px-5 py-2.5 text-sm">Ver Notícias</Link>
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">

                        {/* Conquistas */}
                        <motion.section
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15 }}
                            className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6"
                        >
                            <h2 className="font-black text-white flex items-center gap-2 mb-4">
                                <Trophy className="w-5 h-5 text-yellow-400" />
                                Conquistas
                            </h2>
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
                                <div className="text-center py-4">
                                    <p className="text-xs text-zinc-600">Interaja com o site para desbloquear conquistas!</p>
                                </div>
                            )}
                        </motion.section>

                        {/* Links Rápidos */}
                        <motion.section
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6"
                        >
                            <h2 className="font-black text-white mb-4">Links Rápidos</h2>
                            <div className="space-y-2">
                                {[
                                    { href: '/favorites', icon: Heart, label: 'Meus Favoritos', color: 'text-pink-400' },
                                    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', color: 'text-purple-400' },
                                    { href: '/settings', icon: Settings, label: 'Configurações', color: 'text-zinc-400' },
                                    { href: '/settings/notifications', icon: Newspaper, label: 'Notificações', color: 'text-blue-400' },
                                ].map(({ href, icon: Icon, label, color }) => (
                                    <Link
                                        key={href}
                                        href={href}
                                        className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors group"
                                    >
                                        <Icon className={`w-4 h-4 ${color}`} />
                                        <span className="text-sm text-zinc-300 group-hover:text-white transition-colors">{label}</span>
                                        <ChevronRight className="w-4 h-4 text-zinc-700 group-hover:text-zinc-500 ml-auto transition-colors" />
                                    </Link>
                                ))}
                            </div>
                        </motion.section>

                    </div>
                </div>
            </div>
        </div>
    )
}
