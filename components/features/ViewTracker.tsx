'use client'

import { useEffect } from 'react'

interface ViewTrackerProps {
  artistId?: string
  groupId?: string
  newsId?: string
}

export function ViewTracker({ artistId, groupId, newsId }: ViewTrackerProps) {
  useEffect(() => {
    const url = artistId
      ? `/api/artists/${artistId}/view`
      : groupId
        ? `/api/groups/${groupId}/view`
        : newsId
          ? `/api/news/${newsId}/view`
          : null

    if (!url) return

    // Track view (fire and forget - non-blocking)
    fetch(url, { method: 'POST' }).catch(() => {
      // Silently fail - view tracking is not critical
    })
  }, [artistId, groupId, newsId])

  // This component renders nothing
  return null
}
