'use client'

import { useEffect } from 'react'

declare global {
    interface Window {
        instgrm?: { Embeds: { process(): void } }
    }
}

export function InstagramEmbed({ url }: { url: string }) {
    useEffect(() => {
        if (window.instgrm) {
            window.instgrm.Embeds.process()
        } else {
            const script = document.createElement('script')
            script.src = 'https://www.instagram.com/embeds.js'
            script.async = true
            document.body.appendChild(script)
        }
    }, [url])

    return (
        <div className="flex justify-center my-6">
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
