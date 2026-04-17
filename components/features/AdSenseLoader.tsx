'use client'

import Script from 'next/script'

const CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT

export function AdSenseLoader() {
    if (!CLIENT) return null

    return (
        <Script
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${CLIENT}`}
            crossOrigin="anonymous"
            strategy="lazyOnload"
            onLoad={() => {
                // Desativa Auto Ads automáticos (vignette, anchor, interstitial)
                // Mantém apenas os banners manuais configurados nas páginas
                try {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    ;((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({
                        google_ad_client: CLIENT,
                        enable_page_level_ads: false,
                    })
                } catch {}
            }}
        />
    )
}
