'use client'

import Script from 'next/script'
import { usePathname } from 'next/navigation'

export function UmamiScript({ websiteId }: { websiteId: string }) {
  const pathname = usePathname()
  if (pathname.startsWith('/admin')) return null

  return (
    <Script
      src="/um/script.js"
      data-website-id={websiteId}
      data-host-url="/um"
      strategy="lazyOnload"
    />
  )
}
