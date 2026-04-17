'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'

export type WatchStatus = 'WANT_TO_WATCH' | 'WATCHING' | 'WATCHED' | 'DROPPED'

export interface WatchEntryState {
    status: WatchStatus
    rating: number | null
    notes?: string | null
}

export const WATCH_STATUS_LABELS: Record<WatchStatus, string> = {
    WANT_TO_WATCH: 'Quero assistir',
    WATCHING: 'Assistindo',
    WATCHED: 'Já assisti',
    DROPPED: 'Abandonei',
}

export const WATCH_STATUS_ICONS: Record<WatchStatus, string> = {
    WANT_TO_WATCH: '📌',
    WATCHING: '▶️',
    WATCHED: '✅',
    DROPPED: '✖️',
}

export function useWatchlist() {
    const { status } = useSession()
    // Map productionId → entry
    const [entries, setEntries] = useState<Map<string, WatchEntryState>>(new Map())
    const [isLoaded, setIsLoaded] = useState(false)

    useEffect(() => {
        if (status === 'loading') return

        if (status === 'authenticated') {
            fetch('/api/users/watchlist?compact=true')
                .then(r => r.json())
                .then(data => {
                    const map = new Map<string, WatchEntryState>()
                    for (const e of data.entries ?? []) {
                        map.set(e.productionId, { status: e.status, rating: e.rating })
                    }
                    setEntries(map)
                })
                .catch(() => {})
                .finally(() => setIsLoaded(true))
        } else {
            setIsLoaded(true)
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status])

    const getEntry = useCallback(
        (productionId: string): WatchEntryState | undefined => entries.get(productionId),
        [entries]
    )

    const setEntry = useCallback(
        (productionId: string, data: WatchEntryState) => {
            // Optimistic update
            setEntries(prev => new Map(prev).set(productionId, data))

            fetch(`/api/productions/${productionId}/watch`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            })
                .then(async r => {
                    if (!r.ok) {
                        // Rollback optimistic update on failure
                        const json = await r.json().catch(() => ({}))
                        console.error('Watch entry update failed', json)
                        setEntries(prev => {
                            const next = new Map(prev)
                            next.delete(productionId)
                            return next
                        })
                    }
                })
                .catch(() => {})
        },
        []
    )

    const removeEntry = useCallback(
        (productionId: string) => {
            // Optimistic update
            setEntries(prev => {
                const next = new Map(prev)
                next.delete(productionId)
                return next
            })

            fetch(`/api/productions/${productionId}/watch`, { method: 'DELETE' }).catch(() => {})
        },
        []
    )

    return { getEntry, setEntry, removeEntry, isLoaded, entries }
}
