import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: 'Mediapartners-Google',
                allow: '/',
            },
            {
                userAgent: '*',
                allow: '/',
                disallow: ['/admin/', '/dashboard/', '/api/'],
            },
        ],
        sitemap: 'https://hallyuhub.com.br/sitemap.xml',
    }
}
