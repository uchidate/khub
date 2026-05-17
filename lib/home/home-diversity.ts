export type HomeEntityType = "artist" | "group" | "production" | "article"

type KeyedHomeItem = {
    type: HomeEntityType
    href: string
}

export function homeEntityKey(type: HomeEntityType, href: string) {
    return `${type}:${href}`
}

export function collectHomeEntityKeys(items: KeyedHomeItem[]) {
    return new Set(items.map((item) => homeEntityKey(item.type, item.href)))
}

export function selectDistinctRotatingItem<T>({
    items,
    getKey,
    excludedKeys,
    startIndex = 0,
}: {
    items: T[]
    getKey: (item: T) => string
    excludedKeys: Set<string>
    startIndex?: number
}): T | null {
    if (items.length === 0) return null

    for (let offset = 0; offset < items.length; offset += 1) {
        const item = items[(startIndex + offset) % items.length]
        if (!excludedKeys.has(getKey(item))) return item
    }

    return items[startIndex % items.length]
}

export function selectDistinctItems<T>({
    items,
    getKey,
    excludedKeys,
    limit,
}: {
    items: T[]
    getKey: (item: T) => string
    excludedKeys: Set<string>
    limit: number
}): T[] {
    const selected: T[] = []
    const used = new Set(excludedKeys)

    for (const item of items) {
        const key = getKey(item)
        if (used.has(key)) continue
        selected.push(item)
        used.add(key)
        if (selected.length >= limit) break
    }

    if (selected.length >= limit) return selected

    for (const item of items) {
        const key = getKey(item)
        if (selected.some((selectedItem) => getKey(selectedItem) === key)) continue
        selected.push(item)
        if (selected.length >= limit) break
    }

    return selected
}
