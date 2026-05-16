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

export async function getDailyMetrics(days = 30) {
    const client = getClient()
    const [response] = await client.runReport({
        property: `properties/${PROPERTY_ID}`,
        dateRanges: [{ startDate: `${days}daysAgo`, endDate: 'today' }],
        dimensions: [{ name: 'date' }],
        metrics: [{ name: 'sessions' }, { name: 'activeUsers' }, { name: 'screenPageViews' }],
        orderBys: [{ dimension: { dimensionName: 'date' }, desc: false }],
    })
    return (response.rows ?? []).map(row => ({
        date:      row.dimensionValues?.[0]?.value ?? '',
        sessions:  Number(row.metricValues?.[0]?.value ?? 0),
        users:     Number(row.metricValues?.[1]?.value ?? 0),
        pageviews: Number(row.metricValues?.[2]?.value ?? 0),
    }))
}

export async function getPreviousPeriodMetrics(days = 30) {
    const client = getClient()
    const [response] = await client.runReport({
        property: `properties/${PROPERTY_ID}`,
        dateRanges: [{ startDate: `${days * 2}daysAgo`, endDate: `${days + 1}daysAgo` }],
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

// ─── Google Search Console ────────────────────────────────────────────────────

async function getGscAccessToken(): Promise<string> {
    const clientId     = process.env.GA4_CLIENT_ID
    const clientSecret = process.env.GA4_CLIENT_SECRET
    const refreshToken = process.env.GA4_REFRESH_TOKEN
    if (!clientId || !clientSecret || !refreshToken) {
        throw new Error('GA4_CLIENT_ID, GA4_CLIENT_SECRET ou GA4_REFRESH_TOKEN não configurados')
    }
    const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: refreshToken,
            grant_type: 'refresh_token',
        }),
    })
    const json = await res.json() as { access_token?: string; error?: string }
    if (!json.access_token) throw new Error(`OAuth2 token refresh failed: ${json.error ?? 'unknown'}`)
    return json.access_token
}

const SITE_URL = 'https://www.hallyuhub.com.br/'

async function gscQuery(token: string, body: Record<string, unknown>) {
    const encoded = encodeURIComponent(SITE_URL)
    const res = await fetch(
        `https://www.googleapis.com/webmasters/v3/sites/${encoded}/searchAnalytics/query`,
        {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        },
    )
    if (!res.ok) throw new Error(`GSC API error: ${res.status} ${await res.text()}`)
    return res.json() as Promise<{ rows?: Array<{ keys: string[]; clicks: number; impressions: number; ctr: number; position: number }> }>
}

export async function getSearchConsoleMetrics(days = 30) {
    const token = await getGscAccessToken()
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const prevEnd = new Date(startDate)
    prevEnd.setDate(prevEnd.getDate() - 1)
    const prevStart = new Date(prevEnd)
    prevStart.setDate(prevStart.getDate() - days)

    const fmtDate = (d: Date) => d.toISOString().split('T')[0]
    const base     = { startDate: fmtDate(startDate), endDate: fmtDate(endDate),   dataState: 'all' }
    const prevBase = { startDate: fmtDate(prevStart),  endDate: fmtDate(prevEnd),   dataState: 'all' }

    const [queriesRes, pagesRes, dailyRes, countriesRes, devicesRes, allQueriesRes, queryPageRes, prevQueriesRes] = await Promise.all([
        gscQuery(token, { ...base,     dimensions: ['query'],          rowLimit: 25  }),
        gscQuery(token, { ...base,     dimensions: ['page'],           rowLimit: 100 }),
        gscQuery(token, { ...base,     dimensions: ['date'],           rowLimit: 90  }),
        gscQuery(token, { ...base,     dimensions: ['country'],        rowLimit: 10  }),
        gscQuery(token, { ...base,     dimensions: ['device'],         rowLimit: 5   }),
        gscQuery(token, { ...base,     dimensions: ['query'],          rowLimit: 200 }),
        gscQuery(token, { ...base,     dimensions: ['query', 'page'],  rowLimit: 300 }),
        gscQuery(token, { ...prevBase, dimensions: ['query'],          rowLimit: 200 }),
    ])

    const mapRows = (rows: typeof queriesRes.rows) =>
        (rows ?? []).map(r => ({
            key:         r.keys[0] ?? '',
            clicks:      r.clicks,
            impressions: r.impressions,
            ctr:         parseFloat(r.ctr.toFixed(4)),
            position:    parseFloat(r.position.toFixed(1)),
        }))

    const allQueries  = mapRows(allQueriesRes.rows)
    const prevQueries = mapRows(prevQueriesRes.rows)
    const allPages    = mapRows(pagesRes.rows)

    // ── Opportunities ────────────────────────────────────────────────────────
    const opportunities = allQueries
        .filter(r => r.position >= 4 && r.position <= 30 && r.impressions >= 5)
        .sort((a, b) => b.impressions - a.impressions)
        .slice(0, 20)

    // ── Totals ───────────────────────────────────────────────────────────────
    const totals = {
        clicks:      allQueries.reduce((s, r) => s + r.clicks, 0),
        impressions: allQueries.reduce((s, r) => s + r.impressions, 0),
        avgCtr:      allQueries.length > 0 ? parseFloat((allQueries.reduce((s, r) => s + r.ctr, 0) / allQueries.length).toFixed(4)) : 0,
        avgPosition: allQueries.length > 0 ? parseFloat((allQueries.reduce((s, r) => s + r.position, 0) / allQueries.length).toFixed(1)) : 0,
    }

    // ── Pages with zero clicks (high impressions, no clicks) ─────────────────
    const pagesNoClick = allPages
        .filter(r => r.clicks === 0 && r.impressions >= 5)
        .sort((a, b) => b.impressions - a.impressions)
        .slice(0, 20)

    // ── Section health (group pages by first path segment) ───────────────────
    const sectionMap = new Map<string, { clicks: number; impressions: number; posSum: number; count: number }>()
    allPages.forEach(p => {
        const path    = p.key.replace('https://www.hallyuhub.com.br', '')
        const segment = path.split('/')[1] ?? ''
        const section = segment ? `/${segment}` : '/'
        const s = sectionMap.get(section) ?? { clicks: 0, impressions: 0, posSum: 0, count: 0 }
        s.clicks      += p.clicks
        s.impressions += p.impressions
        s.posSum      += p.position * (p.impressions || 1)
        s.count       += p.impressions || 1
        sectionMap.set(section, s)
    })
    const sectionHealth = Array.from(sectionMap.entries())
        .map(([section, s]) => ({
            section,
            clicks:      s.clicks,
            impressions: s.impressions,
            ctr:         s.impressions > 0 ? parseFloat((s.clicks / s.impressions).toFixed(4)) : 0,
            avgPosition: s.count > 0 ? parseFloat((s.posSum / s.count).toFixed(1)) : 0,
            pageCount:   allPages.filter(p => p.key.includes(`hallyuhub.com.br${section}/`) || p.key.endsWith(`hallyuhub.com.br${section}`)).length,
        }))
        .filter(s => s.impressions > 0)
        .sort((a, b) => b.clicks - a.clicks)

    // ── Falling queries (dropped > 3 positions vs previous period) ───────────
    const prevMap = new Map(prevQueries.map(q => [q.key, q]))
    const fallingQueries = allQueries
        .filter(q => {
            const prev = prevMap.get(q.key)
            return prev && (q.position - prev.position) > 3 && q.impressions >= 10
        })
        .map(q => {
            const prev = prevMap.get(q.key)!
            return { ...q, prevPosition: parseFloat(prev.position.toFixed(1)), drop: parseFloat((q.position - prev.position).toFixed(1)) }
        })
        .sort((a, b) => b.drop - a.drop)
        .slice(0, 15)

    // ── CTR by position bucket (actual vs expected industry average) ──────────
    const ctrBuckets = [
        { label: 'Posição 1',  range: [1, 1],   expected: 0.278 },
        { label: 'Posição 2',  range: [2, 2],   expected: 0.153 },
        { label: 'Posição 3',  range: [3, 3],   expected: 0.114 },
        { label: 'Top 4–10',   range: [4, 10],  expected: 0.050 },
        { label: 'Pos 11–20',  range: [11, 20], expected: 0.016 },
        { label: 'Pos 21–30',  range: [21, 30], expected: 0.005 },
    ].map(({ label, range, expected }) => {
        const qs      = allQueries.filter(q => q.position >= range[0] && q.position <= range[1])
        const impr    = qs.reduce((s, q) => s + q.impressions, 0)
        const clicks  = qs.reduce((s, q) => s + q.clicks, 0)
        const actual  = impr > 0 ? clicks / impr : 0
        return { label, expected, actual: parseFloat(actual.toFixed(4)), count: qs.length, impressions: impr, clicks }
    }).filter(b => b.impressions > 0)

    // ── Brand vs generic ─────────────────────────────────────────────────────
    const brandQ   = allQueries.filter(q => q.key.toLowerCase().includes('hallyuhub'))
    const genericQ = allQueries.filter(q => !q.key.toLowerCase().includes('hallyuhub'))
    const brandVsGeneric = {
        brand:   { clicks: brandQ.reduce((s, q) => s + q.clicks, 0),   impressions: brandQ.reduce((s, q) => s + q.impressions, 0),   count: brandQ.length },
        generic: { clicks: genericQ.reduce((s, q) => s + q.clicks, 0), impressions: genericQ.reduce((s, q) => s + q.impressions, 0), count: genericQ.length },
    }

    // ── Query by page drill-down ─────────────────────────────────────────────
    const queryByPage = (queryPageRes.rows ?? []).map(r => ({
        query:       r.keys[0] ?? '',
        page:        r.keys[1] ?? '',
        clicks:      r.clicks,
        impressions: r.impressions,
        ctr:         parseFloat(r.ctr.toFixed(4)),
        position:    parseFloat(r.position.toFixed(1)),
    }))

    // ── Content gaps: queries sem página dedicada ─────────────────────────────
    // Para cada query, pega a melhor página que aparece. Se essa página ainda
    // rankeia mal (pos > 10), o site não tem uma landing page focada no tema.
    const queryBestPage = new Map<string, number>()
    queryByPage.forEach(r => {
        const best = queryBestPage.get(r.query)
        if (best === undefined || r.position < best) queryBestPage.set(r.query, r.position)
    })
    const contentGaps = allQueries
        .filter(q =>
            q.impressions >= 20 &&
            q.position >= 5 &&
            q.position <= 40 &&
            q.ctr < 0.03 &&
            (queryBestPage.get(q.key) ?? 99) > 10
        )
        .sort((a, b) => b.impressions - a.impressions)
        .slice(0, 20)

    return {
        topQueries:    mapRows(queriesRes.rows),
        topPages:      allPages.slice(0, 20),
        dailyTrend:    mapRows(dailyRes.rows).map(r => ({ date: r.key, clicks: r.clicks, impressions: r.impressions })),
        countries:     mapRows(countriesRes.rows),
        devices:       mapRows(devicesRes.rows),
        opportunities,
        totals,
        pagesNoClick,
        sectionHealth,
        fallingQueries,
        ctrBuckets,
        brandVsGeneric,
        queryByPage,
        contentGaps,
    }
}
