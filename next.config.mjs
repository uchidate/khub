/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    experimental: {
        staleTimes: {
            dynamic: 0,
        },
    },
    async rewrites() {
        // /um/api/send é servido pela route handler em app/um/api/send/route.ts
        // que passa o IP real do cliente diretamente ao Umami via rede Docker interna
        return [
            { source: '/um/script.js', destination: 'https://umami.hallyuhub.com.br/script.js' },
        ]
    },
    async headers() {
        return [
            {
                // Static assets have content-hash filenames — safe to cache forever
                source: '/_next/static/:path*',
                headers: [
                    { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
                ],
            },
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
            // Placeholder images (fallback para imagens sem URL)
            {
                protocol: 'https',
                hostname: 'via.placeholder.com',
            },
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
            // HTTP incluído: artigos importados antes da normalização para HTTPS
            {
                protocol: 'https',
                hostname: 'dramabeans.com',
            },
            {
                protocol: 'https',
                hostname: 'www.dramabeans.com',
            },
            {
                protocol: 'http',
                hostname: 'dramabeans.com',
            },
            {
                protocol: 'http',
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
            // HelloKpop — imagens no próprio domínio (wp-content/uploads)
            {
                protocol: 'https',
                hostname: 'hellokpop.com',
            },
            {
                protocol: 'https',
                hostname: 'www.hellokpop.com',
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
            // Facebook CDN — Instagram também serve imagens via fbcdn.net
            {
                protocol: 'https',
                hostname: '*.fbcdn.net',
            },
            {
                protocol: 'https',
                hostname: '*.instagram.com',
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
            // Mashable — imagens de artigos
            {
                protocol: 'https',
                hostname: 'helios-i.mashable.com',
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
        deviceSizes: [640, 750, 828, 1080, 1200, 1920],
        imageSizes: [16, 32, 48, 64, 96, 128, 160, 256, 384, 512],
        formats: ['image/webp'],
        minimumCacheTTL: 60 * 60 * 24 * 30,
    },
};

export default nextConfig;
