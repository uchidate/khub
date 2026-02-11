import { useState, useEffect, useCallback, useRef } from 'react'

interface Artist {
    id: string
    nameRomanized: string
    nameHangul: string | null
    primaryImageUrl: string | null
    roles: string[]
    trendingScore: number
}

interface News {
    id: string
    title: string
    imageUrl: string | null
    publishedAt: Date
    tags: string[]
}

interface Production {
    id: string
    titlePt: string
    titleKr: string | null
    type: string
    year: number | null
    imageUrl: string | null
    voteAverage: number | null
}

interface SearchResults {
    artists: Artist[]
    news: News[]
    productions: Production[]
    total: number
    query: string
}

export function useGlobalSearch() {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<SearchResults>({
        artists: [],
        news: [],
        productions: [],
        total: 0,
        query: ''
    })
    const [isLoading, setIsLoading] = useState(false)
    const [isOpen, setIsOpen] = useState(false)
    const abortControllerRef = useRef<AbortController | null>(null)

    const search = useCallback(async (searchTerm: string) => {
        if (searchTerm.trim().length < 2) {
            setResults({ artists: [], news: [], productions: [], total: 0, query: '' })
            setIsLoading(false)
            return
        }

        // Cancelar busca anterior se existir
        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
        }

        // Criar novo AbortController
        abortControllerRef.current = new AbortController()

        setIsLoading(true)

        try {
            const response = await fetch(
                `/api/search/global?q=${encodeURIComponent(searchTerm)}&limit=5`,
                { signal: abortControllerRef.current.signal }
            )

            if (!response.ok) {
                throw new Error('Search failed')
            }

            const data = await response.json()
            setResults(data)
        } catch (error: any) {
            // Ignorar erro de abort (é esperado quando cancelamos)
            if (error.name !== 'AbortError') {
                console.error('Search error:', error)
                setResults({ artists: [], news: [], productions: [], total: 0, query: searchTerm })
            }
        } finally {
            setIsLoading(false)
        }
    }, [])

    // Debounce da busca (300ms)
    useEffect(() => {
        const timer = setTimeout(() => {
            if (query.trim().length >= 2) {
                search(query)
            } else {
                setResults({ artists: [], news: [], productions: [], total: 0, query: '' })
            }
        }, 300)

        return () => clearTimeout(timer)
    }, [query, search])

    const clearSearch = useCallback(() => {
        setQuery('')
        setResults({ artists: [], news: [], productions: [], total: 0, query: '' })
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
