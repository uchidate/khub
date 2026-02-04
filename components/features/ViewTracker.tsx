'use client'

import { useEffect } from 'react'

interface ViewTrackerProps {
  artistId: string
}

export function ViewTracker({ artistId }: ViewTrackerProps) {
  useEffect(() => {
    // Track view (fire and forget - non-blocking)
    fetch(`/api/artists/${artistId}/view`, {
      method: 'POST'
    }).catch(() => {
      // Silently fail - view tracking is not critical
    })
  }, [artistId])

  // This component renders nothing
  return null
}
