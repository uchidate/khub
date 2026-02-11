'use client'

import { useState } from 'react'
import { Share2, Twitter, MessageCircle, Check, Link as LinkIcon } from 'lucide-react'

interface ShareButtonsProps {
    title: string
    url: string
}

export function ShareButtons({ title, url }: ShareButtonsProps) {
    const [copied, setCopied] = useState(false)

    const shareOnTwitter = () => {
        const text = `${title} via @HallyuHub`
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
        window.open(twitterUrl, '_blank', 'width=550,height=420')
    }

    const shareOnWhatsApp = () => {
        const text = `${title} - ${url}`
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`
        window.open(whatsappUrl, '_blank')
    }

    const copyLink = async () => {
        try {
            await navigator.clipboard.writeText(url)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (error) {
            console.error('Erro ao copiar link:', error)
        }
    }

    return (
        <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                <Share2 className="w-4 h-4" />
                Compartilhar
            </span>

            <button
                onClick={shareOnTwitter}
                className="flex items-center gap-2 px-4 py-2 bg-[#1DA1F2]/10 hover:bg-[#1DA1F2]/20 border border-[#1DA1F2]/30 text-[#1DA1F2] rounded-lg transition-all hover:scale-105 active:scale-95"
                aria-label="Compartilhar no Twitter"
            >
                <Twitter className="w-4 h-4" />
                <span className="text-xs font-bold uppercase">Twitter</span>
            </button>

            <button
                onClick={shareOnWhatsApp}
                className="flex items-center gap-2 px-4 py-2 bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 text-[#25D366] rounded-lg transition-all hover:scale-105 active:scale-95"
                aria-label="Compartilhar no WhatsApp"
            >
                <MessageCircle className="w-4 h-4" />
                <span className="text-xs font-bold uppercase">WhatsApp</span>
            </button>

            <button
                onClick={copyLink}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all hover:scale-105 active:scale-95 ${
                    copied
                        ? 'bg-green-500/20 border border-green-500/30 text-green-400'
                        : 'bg-zinc-800/50 hover:bg-zinc-800 border border-white/10 text-zinc-300'
                }`}
                aria-label="Copiar link"
            >
                {copied ? (
                    <>
                        <Check className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase">Copiado!</span>
                    </>
                ) : (
                    <>
                        <LinkIcon className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase">Copiar</span>
                    </>
                )}
            </button>
        </div>
    )
}
