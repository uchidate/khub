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
    // fallback:'rest' usa HTTP/JSON em vez de gRPC — necessário em containers Docker
    return new BetaAnalyticsDataClient({ authClient: oauth2 as never, fallback: 'rest' })
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

export async function getTopCountries(days = 30, limit = 8) {
    const client = getClient()
    const [response] = await client.runReport({
        property: `properties/${PROPERTY_ID}`,
        dateRanges: [{ startDate: `${days}daysAgo`, endDate: 'today' }],
        dimensions: [{ name: 'country' }],
        metrics: [{ name: 'activeUsers' }, { name: 'screenPageViews' }],
        orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
        limit,
    })
    return (response.rows ?? []).map(row => ({
        country:   row.dimensionValues?.[0]?.value ?? '',
        users:     Number(row.metricValues?.[0]?.value ?? 0),
        pageviews: Number(row.metricValues?.[1]?.value ?? 0),
    }))
}

export async function getDeviceBreakdown(days = 30) {
    const client = getClient()
    const [response] = await client.runReport({
        property: `properties/${PROPERTY_ID}`,
        dateRanges: [{ startDate: `${days}daysAgo`, endDate: 'today' }],
        dimensions: [{ name: 'deviceCategory' }],
        metrics: [{ name: 'activeUsers' }, { name: 'sessions' }],
        orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
    })
    return (response.rows ?? []).map(row => ({
        device:   row.dimensionValues?.[0]?.value ?? '',
        users:    Number(row.metricValues?.[0]?.value ?? 0),
        sessions: Number(row.metricValues?.[1]?.value ?? 0),
    }))
}

export async function getTrafficSources(days = 30, limit = 8) {
    const client = getClient()
    const [response] = await client.runReport({
        property: `properties/${PROPERTY_ID}`,
        dateRanges: [{ startDate: `${days}daysAgo`, endDate: 'today' }],
        dimensions: [{ name: 'sessionDefaultChannelGroup' }],
        metrics: [{ name: 'sessions' }, { name: 'activeUsers' }],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        limit,
    })
    return (response.rows ?? []).map(row => ({
        channel:  row.dimensionValues?.[0]?.value ?? '',
        sessions: Number(row.metricValues?.[0]?.value ?? 0),
        users:    Number(row.metricValues?.[1]?.value ?? 0),
    }))
}

export async function getSectionEngagement(days = 30) {
    const client = getClient()
    const SECTIONS = ['/artists', '/productions', '/blog', '/groups', '/news', '/calendario', '/loja']
    const [response] = await client.runReport({
        property: `properties/${PROPERTY_ID}`,
        dateRanges: [{ startDate: `${days}daysAgo`, endDate: 'today' }],
        dimensions: [{ name: 'pagePathPlusQueryString' }],
        metrics: [
            { name: 'screenPageViews' },
            { name: 'activeUsers' },
            { name: 'averageSessionDuration' },
            { name: 'bounceRate' },
            { name: 'engagementRate' },
        ],
        orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
        limit: 300,
    })
    const rows = response.rows ?? []
    return SECTIONS.map(section => {
        const sectionRows = rows.filter(r => {
            const path = r.dimensionValues?.[0]?.value ?? ''
            return path === section || path.startsWith(section + '/')
        })
        const pageviews = sectionRows.reduce((s, r) => s + Number(r.metricValues?.[0]?.value ?? 0), 0)
        const users = sectionRows.reduce((s, r) => s + Number(r.metricValues?.[1]?.value ?? 0), 0)
        const avgDuration = sectionRows.length > 0
            ? sectionRows.reduce((s, r) => s + parseFloat(r.metricValues?.[2]?.value ?? '0'), 0) / sectionRows.length
            : 0
        const engagementRate = sectionRows.length > 0
            ? sectionRows.reduce((s, r) => s + parseFloat(r.metricValues?.[4]?.value ?? '0'), 0) / sectionRows.length
            : 0
        return { section, pageviews, users, avgDuration: Math.round(avgDuration), engagementRate: parseFloat(engagementRate.toFixed(3)) }
    }).filter(s => s.pageviews > 0).sort((a, b) => b.pageviews - a.pageviews)
}

export async function getTopExitPages(days = 30, limit = 10) {
    const client = getClient()
    const [response] = await client.runReport({
        property: `properties/${PROPERTY_ID}`,
        dateRanges: [{ startDate: `${days}daysAgo`, endDate: 'today' }],
        dimensions: [{ name: 'exitPagePath' }],
        metrics: [{ name: 'sessions' }],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        limit,
    })
    return (response.rows ?? []).map(row => ({
        path:     row.dimensionValues?.[0]?.value ?? '',
        sessions: Number(row.metricValues?.[0]?.value ?? 0),
    }))
}

export async function getLandingPages(days = 30, limit = 10) {
    const client = getClient()
    const [response] = await client.runReport({
        property: `properties/${PROPERTY_ID}`,
        dateRanges: [{ startDate: `${days}daysAgo`, endDate: 'today' }],
        dimensions: [{ name: 'landingPagePlusQueryString' }],
        metrics: [{ name: 'sessions' }, { name: 'activeUsers' }, { name: 'bounceRate' }],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        limit,
    })
    return (response.rows ?? []).map(row => ({
        path:       row.dimensionValues?.[0]?.value ?? '',
        sessions:   Number(row.metricValues?.[0]?.value ?? 0),
        users:      Number(row.metricValues?.[1]?.value ?? 0),
        bounceRate: parseFloat(row.metricValues?.[2]?.value ?? '0'),
    }))
}

export async function getTopSearchTerms(days = 30, limit = 10) {
    const client = getClient()
    const [response] = await client.runReport({
        property: `properties/${PROPERTY_ID}`,
        dateRanges: [{ startDate: `${days}daysAgo`, endDate: 'today' }],
        dimensions: [{ name: 'searchTerm' }],
        metrics: [{ name: 'sessions' }, { name: 'activeUsers' }],
        dimensionFilter: {
            filter: {
                fieldName: 'searchTerm',
                stringFilter: { matchType: 'PARTIAL_REGEXP', value: '.+' },
            },
        },
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        limit,
    })
    return (response.rows ?? []).map(row => ({
        term:     row.dimensionValues?.[0]?.value ?? '',
        sessions: Number(row.metricValues?.[0]?.value ?? 0),
        users:    Number(row.metricValues?.[1]?.value ?? 0),
    }))
}

export async function getNewVsReturning(days = 30) {
    const client = getClient()
    const [response] = await client.runReport({
        property: `properties/${PROPERTY_ID}`,
        dateRanges: [{ startDate: `${days}daysAgo`, endDate: 'today' }],
        dimensions: [{ name: 'newVsReturning' }],
        metrics: [{ name: 'activeUsers' }, { name: 'sessions' }],
    })
    return (response.rows ?? []).map(row => ({
        type:     row.dimensionValues?.[0]?.value ?? '',
        users:    Number(row.metricValues?.[0]?.value ?? 0),
        sessions: Number(row.metricValues?.[1]?.value ?? 0),
    }))
}
