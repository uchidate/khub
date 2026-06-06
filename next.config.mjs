/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    experimental: {
        staleTimes: {
            dynamic: 0,
            static: 3600,
        },
        staticGenerationMaxConcurrency: 2,
    },
    async redirects() {
        return [
            { source: '/integrantes-do-ive', destination: '/hubs/integrantes-do-ive', permanent: true },
            { source: '/integrantes-do-aespa', destination: '/hubs/integrantes-do-aespa', permanent: true },
            { source: '/integrantes-do-fromis-9', destination: '/hubs/integrantes-do-fromis-9', permanent: true },
            { source: '/integrantes-do-izone', destination: '/hubs/integrantes-do-izone', permanent: true },
            { source: '/integrantes-do-twice', destination: '/hubs/integrantes-do-twice', permanent: true },
            { source: '/integrantes-do-blackpink', destination: '/hubs/integrantes-do-blackpink', permanent: true },
            { source: '/integrantes-do-newjeans', destination: '/hubs/integrantes-do-newjeans', permanent: true },
            { source: '/integrantes-do-le-sserafim', destination: '/hubs/integrantes-do-le-sserafim', permanent: true },
            { source: '/integrantes-do-babymonster', destination: '/hubs/integrantes-do-babymonster', permanent: true },
            { source: '/integrantes-do-nmixx', destination: '/hubs/integrantes-do-nmixx', permanent: true },
            { source: '/integrantes-do-bts', destination: '/hubs/integrantes-do-bts', permanent: true },
            { source: '/integrantes-do-stray-kids', destination: '/hubs/integrantes-do-stray-kids', permanent: true },
            { source: '/integrantes-do-girls-generation', destination: '/hubs/integrantes-do-girls-generation', permanent: true },
            { source: '/integrantes-do-snsd', destination: '/hubs/integrantes-do-girls-generation', permanent: true },
            { source: '/integrantes-do-red-velvet', destination: '/hubs/integrantes-do-red-velvet', permanent: true },
            { source: '/integrantes-do-shinee', destination: '/hubs/integrantes-do-shinee', permanent: true },
            { source: '/integrantes-do-mamamoo', destination: '/hubs/integrantes-do-mamamoo', permanent: true },
            { source: '/integrantes-do-got7', destination: '/hubs/integrantes-do-got7', permanent: true },
            { source: '/integrantes-do-seventeen', destination: '/hubs/integrantes-do-seventeen', permanent: true },
            { source: '/integrantes-do-ateez', destination: '/hubs/integrantes-do-ateez', permanent: true },
            { source: '/integrantes-do-enhypen', destination: '/hubs/integrantes-do-enhypen', permanent: true },
            { source: '/integrantes-do-zerobaseone', destination: '/hubs/integrantes-do-zerobaseone', permanent: true },
            { source: '/integrantes-do-zb1', destination: '/hubs/integrantes-do-zerobaseone', permanent: true },
            { source: '/boy-groups-kpop', destination: '/hubs/grupos-masculinos-kpop', permanent: true },
            { source: '/grupos-masculinos-kpop', destination: '/hubs/grupos-masculinos-kpop', permanent: true },
            { source: '/cantoras-kpop', destination: '/hubs/cantoras-kpop', permanent: true },
            { source: '/solistas-kpop', destination: '/hubs/artistas-solo-kpop', permanent: true },
            { source: '/grupos-femininos-kpop', destination: '/hubs/grupos-femininos-kpop', permanent: true },
            { source: '/girl-groups-kpop', destination: '/hubs/grupos-femininos-kpop', permanent: true },
            { source: '/doramas-netflix', destination: '/hubs/doramas-coreanos-netflix', permanent: true },
            { source: '/idols-atores', destination: '/hubs/idols-que-atuam-em-doramas', permanent: true },
        ]
    },
    async rewrites() {
        // /um/api/send é servido pela route handler em app/um/api/send/route.ts
        // que passa o IP real do cliente diretamente ao Umami via rede Docker interna
        // CUIDs legados → rewrite interno para API route que resolve o slug e retorna
        // 301 — resulta em um único redirect 301 visível para browser/Googlebot
        return [
            { source: '/um/script.js', destination: 'https://umami.hallyuhub.com.br/script.js' },
            { source: '/groups/:id(c[a-z0-9]{24})', missing: [{ type: 'query', key: '_direct' }], destination: '/api/r/groups/:id' },
            { source: '/artists/:id(c[a-z0-9]{24})', missing: [{ type: 'query', key: '_direct' }], destination: '/api/r/artists/:id' },
            { source: '/productions/:id(c[a-z0-9]{24})', missing: [{ type: 'query', key: '_direct' }], destination: '/api/r/productions/:id' },
        ]
    },
    async headers() {
        return [
            {
                source: '/sw.js',
                headers: [
                    { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
                ],
            },
            ...(process.env.NODE_ENV === 'production' ? [{
                // Static assets have content-hash filenames — safe to cache forever in production.
                source: '/_next/static/:path*',
                headers: [
                    { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
                ],
            }] : []),
            {
                source: '/:path*',
                headers: [
                    { key: 'X-Content-Type-Options', value: 'nosniff' },
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
            // Spotify — imagens de artistas retornadas pela Web API
            {
                protocol: 'https',
                hostname: 'i.scdn.co',
            },
            // Naver — blog.naver.com, postfiles.pstatic.net
            {
                protocol: 'https',
                hostname: '*.pstatic.net',
            },
            // Twitter/X CDN — thumbnails de embed
            {
                protocol: 'https',
                hostname: 'pbs.twimg.com',
            },
            // Google User Content (thumbnails, fotos de perfil)
            {
                protocol: 'https',
                hostname: '*.googleusercontent.com',
            },
            {
                protocol: 'https',
                hostname: 'photos.hancinema.net',
            },
            {
                protocol: 'https',
                hostname: '*.hancinema.net',
            },
            // Shopee CDN — imagens de produtos da vitrine afiliada
            {
                protocol: 'https',
                hostname: 'down-br.img.susercontent.com',
            },
            {
                protocol: 'https',
                hostname: '*.susercontent.com',
            },
            // Mercado Livre — thumbnails de produtos
            {
                protocol: 'https',
                hostname: 'http2.mlstatic.com',
            },
            {
                protocol: 'https',
                hostname: '*.mlstatic.com',
            },
        ],
        deviceSizes: [640, 750, 828, 1080, 1200, 1920],
        imageSizes: [16, 32, 48, 64, 96, 128, 160, 256, 384, 512],
        formats: ['image/avif', 'image/webp'],
        minimumCacheTTL: 60 * 60 * 24 * 30,
    },
};

export default nextConfig;
