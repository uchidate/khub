'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Bell, BookOpen, Check, Clock, Compass, Settings, Sparkles, X } from 'lucide-react'

interface Notification {
    id: string
    createdAt: string
    readAt: string | null
    news: { id: string; title: string; imageUrl: string | null } | null
    blogPost: { id: string; slug: string; title: string; coverImageUrl: string | null } | null
}

interface ArticleSuggestion {
    id: string
    slug: string
    title: string
    excerpt: string | null
    coverImageUrl: string | null
    publishedAt: string | null
    readingTimeMin: number
    category: { name: string } | null
}

type Tab = 'unread' | 'all' | 'discover'

function notifHref(n: Notification) {
    if (n.blogPost) return `/blog/${n.blogPost.slug}`
    if (n.news) return `/news/${n.news.id}`
    return '#'
}

function notifTitle(n: Notification) {
    return n.blogPost?.title ?? n.news?.title ?? 'Atualização'
}

function notifImage(n: Notification) {
    return n.blogPost?.coverImageUrl ?? n.news?.imageUrl ?? null
}

function notifKind(n: Notification) {
    if (n.blogPost) return 'Artigo'
    if (n.news) return 'Legado'
    return 'Alerta'
}

function relativeTime(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60_000)
    const hours = Math.floor(diff / 3_600_000)
    const days = Math.floor(diff / 86_400_000)
    if (mins < 1) return 'agora'
    if (mins < 60) return `${mins}m`
    if (hours < 24) return `${hours}h`
    if (days < 7) return `${days}d`
    return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

export function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [latestArticles, setLatestArticles] = useState<ArticleSuggestion[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [open, setOpen] = useState(false)
    const [tab, setTab] = useState<Tab>('unread')
    const dropdownRef = useRef<HTMLDivElement>(null)

    const fetchNotifications = useCallback(async () => {
        try {
            const res = await fetch('/api/users/notifications', { cache: 'no-store' })
            if (res.ok) {
                const data = await res.json()
                setNotifications(data.notifications ?? [])
                setLatestArticles(data.latestArticles ?? [])
                setUnreadCount(data.unreadCount ?? 0)
            }
        } catch {
            // silently ignore
        }
    }, [])

    useEffect(() => {
        fetchNotifications()
        const interval = setInterval(fetchNotifications, 3 * 60_000)
        return () => clearInterval(interval)
    }, [fetchNotifications])

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    const markAllRead = async () => {
        await fetch('/api/users/notifications', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ markAllRead: true }),
        })
        setNotifications(prev => prev.map(n => ({ ...n, readAt: new Date().toISOString() })))
        setUnreadCount(0)
        setTab('all')
    }

    const markRead = async (id: string) => {
        await fetch('/api/users/notifications', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: [id] }),
        })
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
        setUnreadCount(prev => Math.max(0, prev - 1))
    }

    const unreadNotifications = notifications.filter(n => !n.readAt)
    const visibleNotifications = tab === 'unread' ? unreadNotifications : notifications

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => {
                    setOpen(o => !o)
                    setTab(unreadCount > 0 ? 'unread' : 'discover')
                }}
                className="relative rounded-xl p-2 text-muted transition-colors hover:bg-surface hover:text-foreground"
                aria-label="Alertas"
            >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-black text-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 z-50 mt-2 w-[380px] overflow-hidden rounded-2xl border border-border bg-background shadow-2xl shadow-black/10">
                    <div className="border-b border-border bg-surface px-4 py-3">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-accent">Alertas</p>
                                <p className="mt-0.5 text-sm font-black text-foreground">Artigos e atualizações</p>
                            </div>
                            <div className="flex items-center gap-1">
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllRead}
                                        className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-accent hover:bg-accent-soft"
                                    >
                                        <Check className="h-3 w-3" />
                                        Lidas
                                    </button>
                                )}
                                <Link
                                    href="/settings/notifications"
                                    onClick={() => setOpen(false)}
                                    className="rounded-lg p-1.5 text-muted transition-colors hover:bg-background hover:text-foreground"
                                    aria-label="Configurar alertas"
                                >
                                    <Settings className="h-4 w-4" />
                                </Link>
                                <button
                                    onClick={() => setOpen(false)}
                                    aria-label="Fechar alertas"
                                    className="rounded-lg p-1.5 text-muted transition-colors hover:bg-background hover:text-foreground"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        <div className="mt-3 grid grid-cols-3 gap-1 rounded-xl border border-border bg-background p-1">
                            {[
                                { key: 'unread' as const, label: `Novos ${unreadCount ? unreadCount : ''}`.trim() },
                                { key: 'all' as const, label: 'Histórico' },
                                { key: 'discover' as const, label: 'Descobrir' },
                            ].map(item => (
                                <button
                                    key={item.key}
                                    onClick={() => setTab(item.key)}
                                    className={`rounded-lg px-2 py-1.5 text-xs font-black transition-colors ${
                                        tab === item.key ? 'bg-foreground text-background' : 'text-muted hover:text-foreground'
                                    }`}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="max-h-[430px] overflow-y-auto p-2">
                        {tab === 'discover' ? (
                            <div className="space-y-2">
                                <div className="rounded-xl border border-border bg-surface p-3">
                                    <div className="flex items-start gap-3">
                                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-soft text-accent">
                                            <Sparkles className="h-4 w-4" />
                                        </span>
                                        <div>
                                            <p className="text-sm font-black text-foreground">Como o sininho funciona</p>
                                            <p className="mt-1 text-xs leading-5 text-muted">
                                                Você recebe alertas de artigos ligados aos artistas que favoritou. O restante vira sugestão para leitura.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                {latestArticles.map(article => (
                                    <Link
                                        key={article.id}
                                        href={`/blog/${article.slug}`}
                                        onClick={() => setOpen(false)}
                                        className="grid grid-cols-[56px_minmax(0,1fr)] gap-3 rounded-xl border border-border bg-surface p-2 transition-colors hover:border-accent/40"
                                    >
                                        <ArticleThumb src={article.coverImageUrl} />
                                        <span className="min-w-0 py-1">
                                            <span className="block text-[10px] font-black uppercase tracking-[0.1em] text-accent">
                                                {article.category?.name ?? 'Artigo'} · {article.readingTimeMin} min
                                            </span>
                                            <span className="mt-1 line-clamp-2 text-sm font-black leading-tight text-foreground">{article.title}</span>
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        ) : visibleNotifications.length === 0 ? (
                            <div className="py-10 text-center">
                                <Bell className="mx-auto mb-3 h-8 w-8 text-muted/45" />
                                <p className="text-sm font-bold text-foreground">
                                    {tab === 'unread' ? 'Nada novo por enquanto' : 'Nenhum alerta ainda'}
                                </p>
                                <p className="mx-auto mt-1 max-w-[260px] text-xs leading-5 text-muted">
                                    Favorite artistas e acompanhe artigos para receber alertas mais úteis.
                                </p>
                                <button
                                    onClick={() => setTab('discover')}
                                    className="mt-4 inline-flex items-center gap-2 rounded-full border border-border px-3 py-2 text-xs font-black text-foreground hover:border-accent/40 hover:text-accent"
                                >
                                    <Compass className="h-3.5 w-3.5" />
                                    Ver artigos recentes
                                </button>
                            </div>
                        ) : (
                            visibleNotifications.map(n => (
                                <NotificationRow
                                    key={n.id}
                                    notification={n}
                                    onOpen={() => {
                                        setOpen(false)
                                        if (!n.readAt) markRead(n.id)
                                    }}
                                />
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

function ArticleThumb({ src }: { src: string | null }) {
    return (
        <span className="relative h-14 w-14 overflow-hidden rounded-xl bg-background">
            {src ? (
                <Image src={src} alt="" fill className="object-cover" sizes="56px" />
            ) : (
                <span className="flex h-full w-full items-center justify-center text-muted">
                    <BookOpen className="h-5 w-5" />
                </span>
            )}
        </span>
    )
}

function NotificationRow({ notification, onOpen }: { notification: Notification; onOpen: () => void }) {
    const title = notifTitle(notification)
    const image = notifImage(notification)
    const href = notifHref(notification)
    const isUnread = !notification.readAt

    return (
        <Link
            href={href}
            onClick={onOpen}
            className={`grid grid-cols-[48px_minmax(0,1fr)_auto] gap-3 rounded-xl p-2.5 transition-colors hover:bg-surface ${
                isUnread ? 'bg-accent-soft/70' : ''
            }`}
        >
            <ArticleThumb src={image} />
            <span className="min-w-0">
                <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.1em] text-accent">
                    {notifKind(notification)}
                    <span className="inline-flex items-center gap-1 text-muted">
                        <Clock className="h-3 w-3" />
                        {relativeTime(notification.createdAt)}
                    </span>
                </span>
                <span className="mt-1 line-clamp-2 text-sm font-black leading-tight text-foreground">{title}</span>
            </span>
            {isUnread && <span className="mt-2 h-2 w-2 rounded-full bg-accent" aria-label="Não lida" />}
        </Link>
    )
}
