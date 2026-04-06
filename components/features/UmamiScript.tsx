import Script from 'next/script'

export function UmamiScript({ websiteId }: { websiteId: string }) {
  return (
    <Script
      src="/um/script.js"
      data-website-id={websiteId}
      data-host-url="/um"
      data-domains="hallyuhub.com.br,www.hallyuhub.com.br"
      data-exclude-route="/admin,/admin/*"
      strategy="lazyOnload"
    />
  )
}
