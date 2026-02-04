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
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [error, setError] = useState<string | null>(null)
  const debouncedQuery = useDebounce(query, 300)

  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      setIsLoading(true)
      setError(null)
      fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`)
        .then(res => res.json())
        .then(data => {
          setResults(data.results || [])
          setIsLoading(false)
        })
        .catch(err => {
          console.error('Search error:', err)
          setError('Erro ao buscar. Tente novamente.')
          setIsLoading(false)
        })
    } else {
      setResults([])
      setError(null)
      setIsLoading(false)
    }
  }, [debouncedQuery])

  const handleClear = () => {
    setQuery('')
    setResults([])
    setError(null)
    setIsOpen(false)
    setSelectedIndex(-1)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || results.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          const selected = results[selectedIndex]
          window.location.href = getResultUrl(selected)
        }
        break
      case 'Escape':
        e.preventDefault()
        setIsOpen(false)
        setSelectedIndex(-1)
        break
    }
  }

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(-1)
  }, [results])

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
          onKeyDown={handleKeyDown}
          placeholder="Buscar artistas, k-dramas, notícias..."
          className="
            w-full pl-10 pr-10 py-3
            bg-zinc-900 text-white
            border border-zinc-800
            rounded-lg
            focus:outline-none focus:ring-2 focus:ring-purple-500
            placeholder:text-zinc-500
          "
          aria-label="Buscar conteúdo"
          aria-autocomplete="list"
          aria-controls="search-results"
          aria-expanded={isOpen}
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
        <div
          id="search-results"
          role="listbox"
          className="
            absolute top-full mt-2 w-full
            bg-zinc-900 border border-zinc-800
            rounded-lg shadow-2xl
            max-h-96 overflow-y-auto
            z-50
          "
        >
          {results.map((result, index) => (
            <Link
              key={`${result.type}-${result.id}`}
              href={getResultUrl(result)}
              onClick={() => setIsOpen(false)}
              role="option"
              aria-selected={selectedIndex === index}
              className={`
                flex items-center gap-3 p-3
                border-b border-zinc-800 last:border-b-0
                transition-colors
                ${selectedIndex === index ? 'bg-purple-500/20 ring-2 ring-purple-500' : 'hover:bg-zinc-800'}
              `}
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
      {isOpen && query.length >= 2 && results.length === 0 && !isLoading && !error && (
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

      {/* Error Message */}
      {error && isOpen && (
        <div className="
          absolute top-full mt-2 w-full
          bg-red-900/20 border border-red-700
          rounded-lg shadow-2xl
          p-6 text-center text-red-400
          z-50
        ">
          {error}
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
