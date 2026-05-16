import { BetaAnalyticsDataClient } from '@google-analytics/data'
import { OAuth2Client } from 'google-auth-library'

const PROPERTY_ID = '528114209'

function getClient() {
    const clientId     = process.env.GA4_CLIENT_ID
    const clientSecret = process.env.GA4_CLIENT_SECRET
    const refreshToken = process.env.GA4_REFRESH_TOKEN
    if (!clientId || !clientSecret || !refreshToken) {
        throw new Error('GA4_CLIENT_ID, GA4_CLIENT_SECRET ou GA4_REFRESH_TOKEN não configurados')
    }
    const oauth2 = new OAuth2Client(clientId, clientSecret)
    oauth2.setCredentials({ refresh_token: refreshToken })
    return new BetaAnalyticsDataClient({ authClient: oauth2 as never })
}

export async function getActiveUsers(): Promise<number> {
    const client = getClient()
    const [response] = await client.runRealtimeReport({
        property: `properties/${PROPERTY_ID}`,
        metrics: [{ name: 'activeUsers' }],
    })
    return Number(response.rows?.[0]?.metricValues?.[0]?.value ?? 0)
}

export async function getSiteMetrics(days = 30) {
    const client = getClient()
    const [response] = await client.runReport({
        property: `properties/${PROPERTY_ID}`,
        dateRanges: [{ startDate: `${days}daysAgo`, endDate: 'today' }],
        metrics: [
            { name: 'sessions' },
            { name: 'activeUsers' },
            { name: 'screenPageViews' },
            { name: 'bounceRate' },
            { name: 'averageSessionDuration' },
        ],
    })
    const row = response.rows?.[0]?.metricValues ?? []
    return {
        sessions:           Number(row[0]?.value ?? 0),
        users:              Number(row[1]?.value ?? 0),
        pageviews:          Number(row[2]?.value ?? 0),
        bounceRate:         parseFloat(row[3]?.value ?? '0'),
        avgSessionDuration: parseFloat(row[4]?.value ?? '0'),
    }
}

export async function getTopPages(days = 30, limit = 50) {
    const client = getClient()
    const [response] = await client.runReport({
        property: `properties/${PROPERTY_ID}`,
        dateRanges: [{ startDate: `${days}daysAgo`, endDate: 'today' }],
        dimensions: [{ name: 'pagePath' }, { name: 'pageTitle' }],
        metrics: [{ name: 'screenPageViews' }, { name: 'activeUsers' }],
        orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
        limit,
    })
    return (response.rows ?? []).map(row => ({
        path:      row.dimensionValues?.[0]?.value ?? '',
        title:     row.dimensionValues?.[1]?.value ?? '',
        pageviews: Number(row.metricValues?.[0]?.value ?? 0),
        users:     Number(row.metricValues?.[1]?.value ?? 0),
    }))
}

export async function getTopBlogPosts(days = 30, limit = 10) {
    const pages = await getTopPages(days, 100)
    return pages.filter(p => p.path.startsWith('/blog/') && p.path !== '/blog/').slice(0, limit)
}

export async function getTopProductions(days = 30, limit = 10) {
    const pages = await getTopPages(days, 150)
    return pages.filter(p => p.path.startsWith('/productions/') && p.path !== '/productions/').slice(0, limit)
}

export async function getTopArtists(days = 30, limit = 10) {
    const pages = await getTopPages(days, 150)
    return pages.filter(p => p.path.startsWith('/artists/') && p.path !== '/artists/').slice(0, limit)
}
