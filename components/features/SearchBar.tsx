'use client'

import { useState, useEffect } from 'react'
import { Search, X, Loader2 } from 'lucide-react'
import { useDebounce } from '@/hooks/useDebounce'
import Link from 'next/link'

interface SearchResult {
  id: string
  type: 'artist' | 'production' | 'news'
  name: string
  subtitle?: string
  imageUrl?: string
}

export function SearchBar() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const debouncedQuery = useDebounce(query, 300)

  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      setIsLoading(true)
      fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`)
        .then(res => res.json())
        .then(data => {
          setResults(data.results || [])
          setIsLoading(false)
        })
        .catch(err => {
          console.error('Search error:', err)
          setIsLoading(false)
        })
    } else {
      setResults([])
      setIsLoading(false)
    }
  }, [debouncedQuery])

  const handleClear = () => {
    setQuery('')
    setResults([])
    setIsOpen(false)
  }

  return (
    <div className="relative w-full max-w-2xl">
      {/* Search Input */}
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
          size={20}
        />

        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Buscar artistas, k-dramas, notícias..."
          className="
            w-full pl-10 pr-10 py-3
            bg-zinc-900 text-white
            border border-zinc-800
            rounded-lg
            focus:outline-none focus:ring-2 focus:ring-purple-500
            placeholder:text-zinc-500
          "
        />

        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
          >
            <X size={20} />
          </button>
        )}

        {isLoading && (
          <Loader2
            className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-500 animate-spin"
            size={20}
          />
        )}
      </div>

      {/* Results Dropdown */}
      {isOpen && query.length >= 2 && results.length > 0 && (
        <div className="
          absolute top-full mt-2 w-full
          bg-zinc-900 border border-zinc-800
          rounded-lg shadow-2xl
          max-h-96 overflow-y-auto
          z-50
        ">
          {results.map((result) => (
            <Link
              key={`${result.type}-${result.id}`}
              href={getResultUrl(result)}
              onClick={() => setIsOpen(false)}
              className="
                flex items-center gap-3 p-3
                hover:bg-zinc-800
                border-b border-zinc-800 last:border-b-0
                transition-colors
              "
            >
              {result.imageUrl && (
                <img
                  src={result.imageUrl}
                  alt={result.name}
                  className="w-12 h-12 rounded object-cover"
                />
              )}

              <div className="flex-1 min-w-0">
                <div className="font-medium text-white truncate">
                  {result.name}
                </div>
                {result.subtitle && (
                  <div className="text-sm text-zinc-400 truncate">
                    {result.subtitle}
                  </div>
                )}
              </div>

              <div className="text-xs text-zinc-500 uppercase">
                {getTypeLabel(result.type)}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* No Results */}
      {isOpen && query.length >= 2 && results.length === 0 && !isLoading && (
        <div className="
          absolute top-full mt-2 w-full
          bg-zinc-900 border border-zinc-800
          rounded-lg shadow-2xl
          p-6 text-center text-zinc-400
          z-50
        ">
          Nenhum resultado encontrado para "{query}"
        </div>
      )}
    </div>
  )
}

function getResultUrl(result: SearchResult): string {
  switch (result.type) {
    case 'artist':
      return `/v1/artists/${result.id}`
    case 'production':
      return `/v1/productions/${result.id}`
    case 'news':
      return `/v1/news/${result.id}`
    default:
      return '/'
  }
}

function getTypeLabel(type: string): string {
  switch (type) {
    case 'artist':
      return 'Artista'
    case 'production':
      return 'Produção'
    case 'news':
      return 'Notícia'
    default:
      return type
  }
}
