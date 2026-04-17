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
        sitemap: 'https://www.hallyuhub.com.br/sitemap.xml',
    }
}
