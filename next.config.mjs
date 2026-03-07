/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    async headers() {
        return [
            {
                source: '/:path*',
                headers: [
                    { key: 'X-Content-Type-Options', value: 'nosniff' },
                    { key: 'X-Frame-Options', value: 'DENY' },
                    { key: 'X-XSS-Protection', value: '1; mode=block' },
                    { key: 'X-DNS-Prefetch-Control', value: 'on' },
                    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
                    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
                    { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
                ],
            },
        ];
    },
    images: {
        remotePatterns: [
            // Unsplash - Images API & CDN (placeholders, artist photos, news images)
            {
                protocol: 'https',
                hostname: 'images.unsplash.com',
            },
            {
                protocol: 'https',
                hostname: 'api.unsplash.com',
            },
            // TMDB - Movie/TV posters & artist photos
            {
                protocol: 'https',
                hostname: 'image.tmdb.org',
            },
            {
                protocol: 'https',
                hostname: 'api.themoviedb.org',
            },
            // Wikipedia - Artist thumbnails
            {
                protocol: 'https',
                hostname: 'upload.wikimedia.org',
            },
            // Google APIs - Custom Search fallback
            {
                protocol: 'https',
                hostname: 'www.googleapis.com',
            },
            // Pexels - Last resort fallback
            {
                protocol: 'https',
                hostname: 'images.pexels.com',
            },
            {
                protocol: 'https',
                hostname: 'api.pexels.com',
            },
            // Own domain - OG images
            {
                protocol: 'https',
                hostname: 'hallyuhub.com.br',
            },
            {
                protocol: 'https',
                hostname: 'www.hallyuhub.com.br',
            },
            // K-pop News Sources - RSS feeds
            {
                protocol: 'https',
                hostname: 'www.soompi.com',
            },
            {
                protocol: 'https',
                hostname: 'soompi.com',
            },
            // Soompi image CDN (subdomains like 0.soompi.io, 1.soompi.io, etc.)
            {
                protocol: 'https',
                hostname: '*.soompi.io',
            },
            {
                protocol: 'https',
                hostname: 'www.koreaboo.com',
            },
            {
                protocol: 'https',
                hostname: 'koreaboo.com',
            },
            // Koreaboo image CDN
            {
                protocol: 'https',
                hostname: 'image.koreaboo.com',
            },
            {
                protocol: 'https',
                hostname: 'www.kpopstarz.com',
            },
            {
                protocol: 'https',
                hostname: 'kpopstarz.com',
            },
            {
                protocol: 'https',
                hostname: 'www.allkpop.com',
            },
            {
                protocol: 'https',
                hostname: 'allkpop.com',
            },
            // Dramabeans — imagens no próprio domínio (wp-content/uploads)
            {
                protocol: 'https',
                hostname: 'dramabeans.com',
            },
            {
                protocol: 'https',
                hostname: 'www.dramabeans.com',
            },
            // Asian Junkie — imagens no próprio domínio (wp-content/uploads)
            {
                protocol: 'https',
                hostname: 'asianjunkie.com',
            },
            {
                protocol: 'https',
                hostname: 'www.asianjunkie.com',
            },
            // CDN comum usado por portais de notícias WordPress
            {
                protocol: 'https',
                hostname: '*.wp.com',
            },
            // YouTube thumbnails — MVs de grupos musicais
            {
                protocol: 'https',
                hostname: 'img.youtube.com',
            },
            // Instagram CDN — posts do feed via RSS.app
            {
                protocol: 'https',
                hostname: 'scontent.cdninstagram.com',
            },
            {
                protocol: 'https',
                hostname: '*.cdninstagram.com',
            },
            // Cloudflare R2 — CDN próprio (uploads de artistas e grupos)
            {
                protocol: 'https',
                hostname: '*.r2.dev',
            },
            // Kpopping.com — fotos de idols e grupos (curadoria kpopping)
            {
                protocol: 'https',
                hostname: 'kpopping.com',
            },
            {
                protocol: 'https',
                hostname: 'cdn.kpopping.com',
            },
            // Cover Art Archive — capas de álbuns via MusicBrainz
            // coverartarchive.org redireciona para *.archive.org
            {
                protocol: 'https',
                hostname: 'coverartarchive.org',
            },
            {
                protocol: 'https',
                hostname: '*.archive.org',
            },
        ],
    },
};

export default nextConfig;
