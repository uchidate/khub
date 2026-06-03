'use client'

import { useState } from 'react'
import { MessageCircle, Check, Link as LinkIcon } from 'lucide-react'

interface ShareButtonsProps {
    title: string
    url: string
}

export function ShareButtons({ title, url }: ShareButtonsProps) {
    const [copied, setCopied] = useState(false)

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
        <div className="flex items-center gap-2">
            <button
                onClick={shareOnWhatsApp}
                className="flex items-center gap-1.5 px-3 py-2 bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 text-[#25D366] text-[12px] font-semibold transition-colors"
                aria-label="Compartilhar no WhatsApp"
            >
                <MessageCircle className="w-3.5 h-3.5" />
                WhatsApp
            </button>

            <button
                onClick={copyLink}
                className={`flex items-center gap-1.5 px-3 py-2 text-[12px] font-semibold transition-colors ${
                    copied
                        ? 'bg-green-500/10 border border-green-500/30 text-green-400'
                        : 'border border-border text-muted hover:text-foreground'
                }`}
                aria-label="Copiar link"
            >
                {copied ? (
                    <><Check className="w-3.5 h-3.5" />Copiado!</>
                ) : (
                    <><LinkIcon className="w-3.5 h-3.5" />Copiar</>
                )}
            </button>
        </div>
    )
}
