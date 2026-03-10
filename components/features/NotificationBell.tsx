'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Bell, Check, X, Settings } from 'lucide-react'

interface Notification {
    id: string
    createdAt: string
    readAt: string | null
    news: {
        id: string
        title: string
        imageUrl: string | null
    }
}

function relativeTime(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60_000)
    const hours = Math.floor(diff / 3_600_000)
    const days = Math.floor(diff / 86_400_000)
    if (mins < 1) return 'agora'
    if (mins < 60) return `${mins}m atrás`
    if (hours < 24) return `${hours}h atrás`
    if (days < 7) return `${days}d atrás`
    return new Date(dateStr).toLocaleDateString('pt-BR')
}

export function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [open, setOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    const fetchNotifications = useCallback(async () => {
        try {
            const res = await fetch('/api/users/notifications', { cache: 'no-store' })
            if (res.ok) {
                const data = await res.json()
                setNotifications(data.notifications ?? [])
                setUnreadCount(data.unreadCount ?? 0)
            }
        } catch {
            // silently ignore
        }
    }, [])

    // Initial fetch + polling every 3 minutes
    useEffect(() => {
        fetchNotifications()
        const interval = setInterval(fetchNotifications, 3 * 60_000)
        return () => clearInterval(interval)
    }, [fetchNotifications])

    // Close on outside click
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

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setOpen(o => !o)}
                className="relative p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                aria-label="Notificações"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-purple-600 text-white text-[10px] font-black rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 mt-2 w-96 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl z-50 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
                        <span className="text-sm font-bold text-white">Notificações</span>
                        <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllRead}
                                    className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
                                >
                                    <Check className="w-3 h-3" />
                                    Marcar todas
                                </button>
                            )}
                            <Link
                                href="/settings/notifications"
                                onClick={() => setOpen(false)}
                                className="text-zinc-500 hover:text-zinc-300 transition-colors"
                                title="Configurar notificações"
                            >
                                <Settings className="w-4 h-4" />
                            </Link>
                            <button
                                onClick={() => setOpen(false)}
                                className="text-zinc-500 hover:text-white"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* List */}
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="py-10 text-center">
                                <Bell className="w-8 h-8 mx-auto mb-3 text-zinc-700" />
                                <p className="text-sm text-zinc-500 mb-3">Nenhuma notificação ainda</p>
                                <Link
                                    href="/settings/notifications"
                                    onClick={() => setOpen(false)}
                                    className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                                >
                                    Configurar notificações →
                                </Link>
                            </div>
                        ) : (
                            notifications.map(n => (
                                <div
                                    key={n.id}
                                    className={`flex items-start gap-3 px-4 py-3 hover:bg-zinc-800/50 transition-colors border-b border-zinc-800/50 last:border-0 ${!n.readAt ? 'bg-purple-600/5' : ''}`}
                                >
                                    {/* Thumbnail */}
                                    {n.news.imageUrl ? (
                                        <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-zinc-800">
                                            <Image
                                                src={n.news.imageUrl}
                                                alt=""
                                                width={48}
                                                height={48}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    ) : (
                                        <div className="w-12 h-12 rounded-lg flex-shrink-0 bg-zinc-800 flex items-center justify-center">
                                            <Bell className="w-5 h-5 text-zinc-600" />
                                        </div>
                                    )}

                                    {/* Content */}
                                    <div className="flex-1 min-w-0" onClick={() => !n.readAt && markRead(n.id)}>
                                        <Link
                                            href={`/news/${n.news.id}`}
                                            onClick={() => { setOpen(false); if (!n.readAt) markRead(n.id) }}
                                            className="text-xs text-zinc-300 hover:text-white line-clamp-2 leading-relaxed"
                                        >
                                            {n.news.title}
                                        </Link>
                                        <p className="text-[10px] text-zinc-600 mt-1">
                                            {relativeTime(n.createdAt)}
                                        </p>
                                    </div>

                                    {/* Unread dot */}
                                    {!n.readAt && (
                                        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-1.5 flex-shrink-0" />
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
