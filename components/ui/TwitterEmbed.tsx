'use client'

import { useEffect } from 'react'

declare global {
    interface Window {
        twttr?: { widgets: { load(): void } }
    }
}

export function TwitterEmbed({ url }: { url: string }) {
    useEffect(() => {
        if (window.twttr) {
            window.twttr.widgets.load()
        } else {
            const script = document.createElement('script')
            script.src = 'https://platform.twitter.com/widgets.js'
            script.async = true
            script.charset = 'utf-8'
            document.body.appendChild(script)
        }
    }, [url])

    return (
        <div className="flex justify-center my-6">
            <blockquote className="twitter-tweet" data-theme="dark">
                <a href={url} target="_blank" rel="noopener noreferrer">
                    Ver no X (Twitter)
                </a>
            </blockquote>
        </div>
    )
}
