import { ARCHIVE_HUBS } from '../lib/seo/archive-hubs'
import { getHubItems, MIN_INDEXABLE_HUB_ITEMS } from '../lib/seo/hub-items'

type AuditRow = {
    slug: string
    locale: string
    kind: string
    itemCount: number
    status: 'indexable' | 'thin' | 'empty' | 'error'
    error?: string
    errorCode?: string
    errorMeta?: unknown
}

const CONCURRENCY = Number(process.env.HUB_AUDIT_CONCURRENCY ?? 6)

function describeError(error: unknown) {
    if (!error || typeof error !== 'object') {
        return { error: String(error) }
    }

    const record = error as {
        message?: unknown
        code?: unknown
        meta?: unknown
    }

    return {
        error: typeof record.message === 'string' ? record.message.trim() : String(error),
        errorCode: typeof record.code === 'string' ? record.code : undefined,
        errorMeta: record.meta,
    }
}

async function auditHub(hub: (typeof ARCHIVE_HUBS)[number]): Promise<AuditRow> {
    try {
        const items = await getHubItems(hub)
        const itemCount = items.length
        return {
            slug: hub.slug,
            locale: hub.locale ?? 'pt',
            kind: hub.kind,
            itemCount,
            status: itemCount === 0 ? 'empty' : itemCount < MIN_INDEXABLE_HUB_ITEMS ? 'thin' : 'indexable',
        }
    } catch (error) {
        const details = describeError(error)
        return {
            slug: hub.slug,
            locale: hub.locale ?? 'pt',
            kind: hub.kind,
            itemCount: 0,
            status: 'error',
            ...details,
        }
    }
}

async function main() {
    const rows: AuditRow[] = []

    for (let index = 0; index < ARCHIVE_HUBS.length; index += CONCURRENCY) {
        const batch = ARCHIVE_HUBS.slice(index, index + CONCURRENCY)
        rows.push(...await Promise.all(batch.map(auditHub)))
    }

    rows.sort((a, b) => {
        const statusOrder = { error: 0, empty: 1, thin: 2, indexable: 3 }
        return statusOrder[a.status] - statusOrder[b.status] || a.itemCount - b.itemCount || a.slug.localeCompare(b.slug)
    })

    const summary = rows.reduce<Record<AuditRow['status'], number>>((acc, row) => {
        acc[row.status] += 1
        return acc
    }, { indexable: 0, thin: 0, empty: 0, error: 0 })

    console.log(JSON.stringify({
        total: rows.length,
        minimumIndexableItems: MIN_INDEXABLE_HUB_ITEMS,
        summary,
        rows,
    }, null, 2))
}

main().catch(error => {
    console.error(error)
    process.exit(1)
})
