'use client'

import { useEffect } from 'react'

interface ViewTrackerProps {
  artistId?: string
  groupId?: string
  newsId?: string
  productionId?: string
}

export function ViewTracker({ artistId, groupId, newsId, productionId }: ViewTrackerProps) {
  useEffect(() => {
    const url = artistId
      ? `/api/artists/${artistId}/view`
      : groupId
        ? `/api/groups/${groupId}/view`
        : newsId
          ? `/api/news/${newsId}/view`
          : productionId
            ? `/api/productions/${productionId}/view`
            : null

    if (!url) return

    fetch(url, { method: 'POST', credentials: 'same-origin' }).catch(() => {})
  }, [artistId, groupId, newsId, productionId])

  return null
}
