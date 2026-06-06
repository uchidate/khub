export function escapeXml(value: string | null | undefined): string {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;')
}

export function xmlResponse(body: string, contentType = 'application/xml; charset=utf-8') {
    return new Response(body, {
        headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
        },
    })
}
