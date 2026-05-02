import { useState, useEffect, useCallback, useRef } from 'react'

interface Artist {
    id: string
    slug?: string | null
    nameRomanized: string
    nameHangul: string | null
    primaryImageUrl: string | null
    roles: string[]
    gender?: number | null
    trendingScore: number
}

interface Article {
    id: string
    slug: string
    title: string
    excerpt: string | null
    coverImageUrl: string | null
    publishedAt: string
}

interface Production {
    id: string
    slug?: string | null
    titlePt: string
    titleKr: string | null
    type: string
    year: number | null
    imageUrl: string | null
    voteAverage: number | null
}

interface Group {
    id: string
    slug?: string | null
    name: string
    nameHangul: string | null
    profileImageUrl: string | null
    debutDate: string | null
}

interface SearchResults {
    artists: Artist[]
    groups: Group[]
    articles: Article[]
    productions: Production[]
    total: number
    query: string
}

const EMPTY: SearchResults = { artists: [], groups: [], articles: [], productions: [], total: 0, query: '' }

export function useGlobalSearch() {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<SearchResults>(EMPTY)
    const [isLoading, setIsLoading] = useState(false)
    const [isOpen, setIsOpen] = useState(false)
    const abortControllerRef = useRef<AbortController | null>(null)

    const search = useCallback(async (searchTerm: string) => {
        if (searchTerm.trim().length < 2) {
            setResults(EMPTY)
            setIsLoading(false)
            return
        }

        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
        }

        abortControllerRef.current = new AbortController()
        setIsLoading(true)

        try {
            const response = await fetch(
                `/api/search/global?q=${encodeURIComponent(searchTerm)}&limit=5&types=artists,groups,productions,articles`,
                { signal: abortControllerRef.current.signal }
            )

            if (!response.ok) throw new Error('Search failed')

            const data = await response.json()
            setResults(data)
        } catch (error: any) {
            if (error.name !== 'AbortError') {
                setResults({ ...EMPTY, query: searchTerm })
            }
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        const timer = setTimeout(() => {
            if (query.trim().length >= 2) {
                search(query)
            } else {
                setResults(EMPTY)
            }
        }, 300)

        return () => clearTimeout(timer)
    }, [query, search])

    const clearSearch = useCallback(() => {
        setQuery('')
        setResults(EMPTY)
        setIsOpen(false)
    }, [])

    return {
        query,
        setQuery,
        results,
        isLoading,
        isOpen,
        setIsOpen,
        clearSearch
    }
}
