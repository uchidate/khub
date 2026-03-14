'use client'

import { useEffect } from 'react'

declare global {
    interface Window {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        tiktok?: any
    }
}

function extractVideoId(url: string): string | null {
    return (
        url.match(/\/video\/(\d+)/)?.[1] ??
        url.match(/\/embed\/v2\/(\d+)/)?.[1] ??
        null
    )
}

export function TikTokEmbed({ url }: { url: string }) {
    const videoId = extractVideoId(url)

    useEffect(() => {
        if (!videoId) return
        const script = document.createElement('script')
        script.src = 'https://www.tiktok.com/embed.js'
        script.async = true
        document.body.appendChild(script)
    }, [videoId])

    if (!videoId) {
        return (
            <div className="my-6">
                <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-400 underline underline-offset-4"
                >
                    Ver no TikTok
                </a>
            </div>
        )
    }

    return (
        <div className="flex justify-center my-6">
            <blockquote
                className="tiktok-embed"
                cite={url}
                data-video-id={videoId}
                data-embed-from="oembed"
                style={{ maxWidth: 605, minWidth: 325 }}
            >
                <section>
                    <a
                        target="_blank"
                        rel="noopener noreferrer"
                        href={url}
                    >
                        Ver no TikTok
                    </a>
                </section>
            </blockquote>
        </div>
    )
}
