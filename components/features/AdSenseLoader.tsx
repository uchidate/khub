'use client'

import Script from 'next/script'

const CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT

export function AdSenseLoader() {
    if (!CLIENT) return null

    return (
        <Script
            id="adsense-loader"
            async
            src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            data-ad-client={CLIENT}
            crossOrigin="anonymous"
            strategy="afterInteractive"
        />
    )
}
