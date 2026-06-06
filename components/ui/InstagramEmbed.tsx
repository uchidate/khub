'use client'

import { useEffect } from 'react'

declare global {
    interface Window {
        instgrm?: { Embeds: { process(): void } }
    }
}

function isPostUrl(url: string) {
    try {
        const parsed = new URL(url)
        const host = parsed.hostname.toLowerCase()
        if (host !== 'instagram.com' && host !== 'www.instagram.com') return false
        return /^\/(p|reel|tv)\/[A-Za-z0-9_-]+\/?$/.test(parsed.pathname)
    } catch {
        return false
    }
}

function extractHandle(url: string) {
    try {
        const parsed = new URL(url)
        const host = parsed.hostname.toLowerCase()
        if (host !== 'instagram.com' && host !== 'www.instagram.com') return null
        const firstSegment = parsed.pathname.split('/').filter(Boolean)[0]
        if (!firstSegment) return null
        if (firstSegment === 'p' || firstSegment === 'reel' || firstSegment === 'tv') return null
        return `@${firstSegment}`
    } catch {
        return null
    }
}

function InstagramProfileCard({ url }: { url: string }) {
    const handle = extractHandle(url)
    return (
        <div className="my-6">
            <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-4 p-4 rounded-2xl border border-border hover:border-pink-400/50 bg-surface hover:bg-surface-hover transition-all"
            >
                {/* Instagram gradient icon */}
                <div className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center" style={{
                    background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)'
                }}>
                    <svg viewBox="0 0 24 24" fill="white" className="w-6 h-6">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-widest text-pink-500 mb-0.5">Instagram</p>
                    <p className="text-base font-bold text-foreground group-hover:text-pink-500 transition-colors">
                        {handle ?? url}
                    </p>
                    <p className="text-xs text-muted mt-0.5">Ver perfil no Instagram</p>
                </div>
                <span className="text-muted text-xs shrink-0 group-hover:text-pink-500 transition-colors">→</span>
            </a>
        </div>
    )
}

export function InstagramEmbed({ url }: { url: string }) {
    const isPost = isPostUrl(url)

    useEffect(() => {
        if (!isPost) return
        if (window.instgrm) {
            window.instgrm.Embeds.process()
        } else {
            const existing = document.querySelector('script[src="https://www.instagram.com/embeds.js"]')
            if (existing) {
                existing.addEventListener('load', () => window.instgrm?.Embeds.process())
            } else {
                const script = document.createElement('script')
                script.src = 'https://www.instagram.com/embeds.js'
                script.async = true
                script.onload = () => window.instgrm?.Embeds.process()
                document.body.appendChild(script)
            }
        }
    }, [url, isPost])

    if (!isPost) return <InstagramProfileCard url={url} />

    return (
        <div className="flex justify-center my-6 min-h-[540px]">
            <blockquote
                className="instagram-media"
                data-instgrm-permalink={url}
                data-instgrm-version="14"
                style={{
                    background: '#FFF',
                    border: 0,
                    borderRadius: '3px',
                    boxShadow: '0 0 1px 0 rgba(0,0,0,0.5),0 1px 10px 0 rgba(0,0,0,0.15)',
                    margin: '1px',
                    maxWidth: '540px',
                    minWidth: '326px',
                    padding: 0,
                    width: 'calc(100% - 2px)',
                }}
            >
                <a href={url} target="_blank" rel="noopener noreferrer">
                    Ver no Instagram
                </a>
            </blockquote>
        </div>
    )
}
