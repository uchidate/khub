export function extractYoutubeId(url: string): string | null {
    try {
        const u = new URL(url)
        if (u.hostname.includes('youtube.com') || u.hostname === 'youtu.be') {
            const v = u.searchParams.get('v')
            if (v) return v
            if (u.hostname === 'youtu.be') return u.pathname.slice(1)
            const m = u.pathname.match(/\/embed\/([^/?]+)/)
            if (m) return m[1]
        }
        return null
    } catch { return null }
}
