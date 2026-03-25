'use client'

import { useEffect } from 'react'

export function BlogViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    fetch(`/api/blog/${slug}/view`, { method: 'POST' }).catch(() => {})
  }, [slug])

  return null
}
