'use client'

import { useEffect, useState } from 'react'

declare global {
    interface Window {
        twttr?: { widgets: { load(): void } }
    }
}

function isDirectTweetUrl(url: string): boolean {
    return /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/[^/\s]+\/status\/\d+/i.test(url)
}

function loadWidgetsScript() {
    if (window.twttr) {
        window.twttr.widgets.load()
    } else {
        const script = document.createElement('script')
        script.src = 'https://platform.twitter.com/widgets.js'
        script.async = true
        script.charset = 'utf-8'
        document.body.appendChild(script)
    }
}

export function TwitterEmbed({ url }: { url: string }) {
    const [tweetUrl, setTweetUrl] = useState<string | null>(
        isDirectTweetUrl(url) ? url : null
    )

    useEffect(() => {
        if (isDirectTweetUrl(url)) {
            setTweetUrl(url)
            return
        }
        // Resolve shortlink (t.co) server-side to find the real URL
        fetch(`/api/resolve-url?url=${encodeURIComponent(url)}`)
            .then(r => r.json())
            .then(data => {
                if (isDirectTweetUrl(data.url)) setTweetUrl(data.url)
            })
            .catch(() => {})
    }, [url])

    useEffect(() => {
        if (tweetUrl) loadWidgetsScript()
    }, [tweetUrl])

    if (!tweetUrl) return null

    return (
        <div className="flex justify-center my-6">
            <blockquote className="twitter-tweet" data-theme="dark">
                <a href={tweetUrl} target="_blank" rel="noopener noreferrer">
                    Ver no X (Twitter)
                </a>
            </blockquote>
        </div>
    )
}
