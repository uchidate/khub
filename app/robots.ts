import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                // AdsBot crawlers não são cobertos pelo wildcard (*) — devem ser explícitos
                userAgent: ['Mediapartners-Google', 'AdsBot-Google'],
                allow: '/',
                disallow: [
                    '/admin/',
                    '/api/',
                    '/um/',
                    '/auth/',
                    '/_next/',
                ],
            },
            {
                userAgent: '*',
                allow: '/',
                disallow: [
                    '/admin/',
                    '/dashboard/',
                    '/api/',
                    '/um/',
                    '/auth/',
                    '/profile/',
                    '/settings/',
                    '/favorites/',
                    '/watchlist/',
                    '/news/',
                    '/blog/preview/',
                    '/search',
                    '/write',
                    '/lists/',
                    '/_next/',
                ],
            },
        ],
        sitemap: [
            'https://www.hallyuhub.com.br/sitemap_index.xml',
            'https://www.hallyuhub.com.br/sitemap.xml',
            'https://www.hallyuhub.com.br/sitemaps/artists.xml',
            'https://www.hallyuhub.com.br/sitemaps/groups.xml',
            'https://www.hallyuhub.com.br/sitemaps/productions.xml',
            'https://www.hallyuhub.com.br/sitemaps/blog.xml',
            'https://www.hallyuhub.com.br/sitemaps/archives.xml',
            'https://www.hallyuhub.com.br/sitemaps/images.xml',
            'https://www.hallyuhub.com.br/sitemaps/videos.xml',
        ],
    }
}
