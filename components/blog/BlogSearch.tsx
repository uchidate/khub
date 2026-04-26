'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function BlogSearch() {
  const [query, setQuery] = useState('')
  const router = useRouter()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const q = query.trim()
    if (q) router.push(`/search?q=${encodeURIComponent(q)}`)
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="search"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Buscar artigos..."
        className="w-full px-4 py-2 text-xs rounded-xl bg-surface border border-border focus:border-accent focus:outline-none transition-colors placeholder:text-muted"
      />
    </form>
  )
}
