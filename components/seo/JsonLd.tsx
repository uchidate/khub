import Script from 'next/script'

export function JsonLd({ data }: { data: Record<string, unknown> }) {
    const type = Array.isArray(data['@type']) ? data['@type'][0] : data['@type']
    const id = `jsonld-${type ?? 'schema'}-${JSON.stringify(data).length}`
    return (
        <Script
            id={id}
            type="application/ld+json"
            strategy="beforeInteractive"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
        />
    )
}
