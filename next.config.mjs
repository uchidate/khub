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
            { source: '/integrantes-do-exo', destination: '/hubs/integrantes-do-exo', permanent: true },
            { source: '/integrantes-do-bigbang', destination: '/hubs/integrantes-do-bigbang', permanent: true },
            { source: '/integrantes-do-2ne1', destination: '/hubs/integrantes-do-2ne1', permanent: true },
            { source: '/integrantes-do-txt', destination: '/hubs/integrantes-do-txt', permanent: true },
            { source: '/integrantes-do-tomorrow-x-together', destination: '/hubs/integrantes-do-txt', permanent: true },
            { source: '/integrantes-do-nct', destination: '/hubs/integrantes-do-nct', permanent: true },
            { source: '/integrantes-do-itzy', destination: '/hubs/integrantes-do-itzy', permanent: true },
            { source: '/integrantes-do-g-i-dle', destination: '/hubs/integrantes-do-g-i-dle', permanent: true },
            { source: '/integrantes-do-gidle', destination: '/hubs/integrantes-do-g-i-dle', permanent: true },
            { source: '/integrantes-do-super-junior', destination: '/hubs/integrantes-do-super-junior', permanent: true },
            { source: '/integrantes-do-suju', destination: '/hubs/integrantes-do-super-junior', permanent: true },
            { source: '/integrantes-do-kep1er', destination: '/hubs/integrantes-do-kep1er', permanent: true },
            { source: '/integrantes-do-loona', destination: '/hubs/integrantes-do-loona', permanent: true },
            { source: '/integrantes-do-apink', destination: '/hubs/integrantes-do-apink', permanent: true },
            { source: '/integrantes-do-sistar', destination: '/hubs/integrantes-do-sistar', permanent: true },
            { source: '/integrantes-do-gfriend', destination: '/hubs/integrantes-do-gfriend', permanent: true },
            { source: '/cantoras-kpop', destination: '/hubs/cantoras-kpop', permanent: true },
            { source: '/solistas-kpop', destination: '/hubs/artistas-solo-kpop', permanent: true },
            { source: '/grupos-femininos-kpop', destination: '/hubs/grupos-femininos-kpop', permanent: true },
            { source: '/girl-groups-kpop', destination: '/hubs/grupos-femininos-kpop', permanent: true },
            { source: '/doramas-netflix', destination: '/hubs/doramas-coreanos-netflix', permanent: true },
            { source: '/idols-atores', destination: '/hubs/idols-que-atuam-em-doramas', permanent: true },
            { source: '/integrantes-do-monsta-x', destination: '/hubs/integrantes-do-monsta-x', permanent: true },
            { source: '/integrantes-do-vixx', destination: '/hubs/integrantes-do-vixx', permanent: true },
            { source: '/integrantes-do-btob', destination: '/hubs/integrantes-do-btob', permanent: true },
            { source: '/integrantes-do-day6', destination: '/hubs/integrantes-do-day6', permanent: true },
            { source: '/integrantes-do-t-ara', destination: '/hubs/integrantes-do-t-ara', permanent: true },
            { source: '/integrantes-do-tara', destination: '/hubs/integrantes-do-t-ara', permanent: true },
            { source: '/integrantes-do-exid', destination: '/hubs/integrantes-do-exid', permanent: true },
            { source: '/integrantes-do-wonder-girls', destination: '/hubs/integrantes-do-wonder-girls', permanent: true },
            { source: '/integrantes-do-ft-island', destination: '/hubs/integrantes-do-ft-island', permanent: true },
            { source: '/integrantes-do-ftisland', destination: '/hubs/integrantes-do-ft-island', permanent: true },
            { source: '/integrantes-do-cnblue', destination: '/hubs/integrantes-do-cnblue', permanent: true },
            { source: '/integrantes-do-infinite', destination: '/hubs/integrantes-do-infinite', permanent: true },
            { source: '/integrantes-do-block-b', destination: '/hubs/integrantes-do-block-b', permanent: true },
            { source: '/integrantes-do-blockb', destination: '/hubs/integrantes-do-block-b', permanent: true },
            { source: '/integrantes-do-b1a4', destination: '/hubs/integrantes-do-b1a4', permanent: true },
            { source: '/integrantes-do-bap', destination: '/hubs/integrantes-do-bap', permanent: true },
            { source: '/integrantes-do-b-a-p', destination: '/hubs/integrantes-do-bap', permanent: true },
            { source: '/integrantes-do-oh-my-girl', destination: '/hubs/integrantes-do-oh-my-girl', permanent: true },
            { source: '/integrantes-do-omg', destination: '/hubs/integrantes-do-oh-my-girl', permanent: true },
            { source: '/integrantes-do-miss-a', destination: '/hubs/integrantes-do-miss-a', permanent: true },
            { source: '/integrantes-do-dreamcatcher', destination: '/hubs/integrantes-do-dreamcatcher', permanent: true },
            { source: '/integrantes-do-wanna-one', destination: '/hubs/integrantes-do-wanna-one', permanent: true },
            { source: '/integrantes-do-wannaone', destination: '/hubs/integrantes-do-wanna-one', permanent: true },
            { source: '/integrantes-do-stayc', destination: '/hubs/integrantes-do-stayc', permanent: true },
            { source: '/integrantes-do-riize', destination: '/hubs/integrantes-do-riize', permanent: true },
            { source: '/integrantes-do-nct-127', destination: '/hubs/integrantes-do-nct-127', permanent: true },
            { source: '/integrantes-do-nct-dream', destination: '/hubs/integrantes-do-nct-dream', permanent: true },
            { source: '/integrantes-do-wayv', destination: '/hubs/integrantes-do-wayv', permanent: true },
            { source: '/integrantes-do-ikon', destination: '/hubs/integrantes-do-ikon', permanent: true },
            { source: '/integrantes-do-winner', destination: '/hubs/integrantes-do-winner', permanent: true },
            { source: '/integrantes-do-teen-top', destination: '/hubs/integrantes-do-teen-top', permanent: true },
            { source: '/integrantes-do-after-school', destination: '/hubs/integrantes-do-after-school', permanent: true },
            { source: '/integrantes-do-beast', destination: '/hubs/integrantes-do-beast', permanent: true },
            { source: '/integrantes-do-highlight', destination: '/hubs/integrantes-do-beast', permanent: true },
            { source: '/integrantes-do-fx', destination: '/hubs/integrantes-do-fx', permanent: true },
            { source: '/integrantes-do-f-x', destination: '/hubs/integrantes-do-fx', permanent: true },
            { source: '/integrantes-do-4minute', destination: '/hubs/integrantes-do-4minute', permanent: true },
            { source: '/integrantes-do-kara', destination: '/hubs/integrantes-do-kara', permanent: true },
            { source: '/integrantes-do-aoa', destination: '/hubs/integrantes-do-aoa', permanent: true },
            { source: '/integrantes-do-sf9', destination: '/hubs/integrantes-do-sf9', permanent: true },
            { source: '/integrantes-do-pentagon', destination: '/hubs/integrantes-do-pentagon', permanent: true },
            { source: '/integrantes-do-p1harmony', destination: '/hubs/integrantes-do-p1harmony', permanent: true },
            { source: '/integrantes-do-weeekly', destination: '/hubs/integrantes-do-weeekly', permanent: true },
            { source: '/integrantes-do-brave-girls', destination: '/hubs/integrantes-do-brave-girls', permanent: true },
            { source: '/integrantes-do-brown-eyed-girls', destination: '/hubs/integrantes-do-brown-eyed-girls', permanent: true },
            { source: '/integrantes-do-beg', destination: '/hubs/integrantes-do-brown-eyed-girls', permanent: true },
            { source: '/integrantes-do-boynextdoor', destination: '/hubs/integrantes-do-boynextdoor', permanent: true },
            { source: '/integrantes-do-and-team', destination: '/hubs/integrantes-do-and-team', permanent: true },
            { source: '/integrantes-do-andteam', destination: '/hubs/integrantes-do-and-team', permanent: true },
            { source: '/integrantes-do-everglow', destination: '/hubs/integrantes-do-everglow', permanent: true },
            { source: '/integrantes-do-clc', destination: '/hubs/integrantes-do-clc', permanent: true },
            { source: '/integrantes-do-cravity', destination: '/hubs/integrantes-do-cravity', permanent: true },
            { source: '/integrantes-do-treasure', destination: '/hubs/integrantes-do-treasure', permanent: true },
            { source: '/integrantes-do-tws', destination: '/hubs/integrantes-do-tws', permanent: true },
            { source: '/integrantes-do-onf', destination: '/hubs/integrantes-do-onf', permanent: true },
            { source: '/integrantes-do-victon', destination: '/hubs/integrantes-do-victon', permanent: true },
            { source: '/doramas-historicos', destination: '/hubs/doramas-historicos-coreanos', permanent: true },
            { source: '/sageuk', destination: '/hubs/doramas-historicos-coreanos', permanent: true },
            { source: '/doramas-prime-video', destination: '/hubs/doramas-amazon-prime', permanent: true },
            { source: '/doramas-amazon', destination: '/hubs/doramas-amazon-prime', permanent: true },
            { source: '/kpop-4a-geracao', destination: '/hubs/grupos-4a-geracao-kpop', permanent: true },
            { source: '/kpop-4th-gen', destination: '/hubs/grupos-4a-geracao-kpop', permanent: true },
            { source: '/kpop-3a-geracao', destination: '/hubs/grupos-3a-geracao-kpop', permanent: true },
            { source: '/kpop-3rd-gen', destination: '/hubs/grupos-3a-geracao-kpop', permanent: true },
            { source: '/hub/iu', destination: '/hubs/iu', permanent: true },
            { source: '/hub/taeyeon', destination: '/hubs/taeyeon', permanent: true },
            { source: '/hub/g-dragon', destination: '/hubs/g-dragon', permanent: true },
            { source: '/hub/gd', destination: '/hubs/g-dragon', permanent: true },
            { source: '/hub/taeyang', destination: '/hubs/taeyang', permanent: true },
            { source: '/hub/zico', destination: '/hubs/zico', permanent: true },
            { source: '/hub/hyuna', destination: '/hubs/hyuna', permanent: true },
            { source: '/hub/sunmi', destination: '/hubs/sunmi', permanent: true },
            { source: '/hub/baekhyun', destination: '/hubs/baekhyun', permanent: true },
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
