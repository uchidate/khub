/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
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
            {
                protocol: 'https',
                hostname: 'www.koreaboo.com',
            },
            {
                protocol: 'https',
                hostname: 'koreaboo.com',
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
            // CDN comum usado por portais de notícias
            {
                protocol: 'https',
                hostname: '*.wp.com',
            },
        ],
    },
};

export default nextConfig;
