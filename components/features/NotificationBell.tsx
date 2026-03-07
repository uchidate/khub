'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { Bell, Check, X } from 'lucide-react'

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
                <div className="absolute right-0 mt-2 w-80 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl z-50 overflow-hidden">
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
                            <button
                                onClick={() => setOpen(false)}
                                className="text-zinc-500 hover:text-white"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="py-8 text-center text-sm text-zinc-600">
                                Nenhuma notificação
                            </div>
                        ) : (
                            notifications.map(n => (
                                <div
                                    key={n.id}
                                    className={`flex items-start gap-3 px-4 py-3 hover:bg-zinc-800/50 transition-colors border-b border-zinc-800/50 last:border-0 ${!n.readAt ? 'bg-purple-600/5' : ''}`}
                                >
                                    {!n.readAt && (
                                        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 flex-shrink-0" />
                                    )}
                                    <div className="flex-1 min-w-0" onClick={() => !n.readAt && markRead(n.id)}>
                                        <Link
                                            href={`/news/${n.news.id}`}
                                            onClick={() => { setOpen(false); if (!n.readAt) markRead(n.id) }}
                                            className="text-xs text-zinc-300 hover:text-white line-clamp-2"
                                        >
                                            {n.news.title}
                                        </Link>
                                        <p className="text-[10px] text-zinc-600 mt-0.5">
                                            {new Date(n.createdAt).toLocaleDateString('pt-BR')}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
