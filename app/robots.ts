import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                // AdsBot crawlers não são cobertos pelo wildcard (*) — devem ser explícitos
                userAgent: ['Mediapartners-Google', 'AdsBot-Google'],
                allow: '/',
            },
            {
                userAgent: '*',
                allow: '/',
                disallow: [
                    '/admin/',
                    '/dashboard/',
                    '/api/',
                    '/premium',
                    '/auth/',
                    '/profile/',
                    '/settings/',
                    '/favorites/',
                    '/watchlist/',
                    '/news/feed/',
                ],
            },
        ],
        sitemap: 'https://www.hallyuhub.com.br/sitemap.xml',
    }
}
