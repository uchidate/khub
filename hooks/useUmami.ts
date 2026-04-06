'use client'

declare global {
  interface Window {
    umami?: {
      track: (eventName: string, data?: Record<string, string | number | boolean>) => void
    }
  }
}

function track(event: string, data?: Record<string, string | number | boolean>) {
  if (typeof window !== 'undefined' && window.umami) {
    window.umami.track(event, data)
  }
}

export function useUmami() {
  return {
    trackSearch: (query: string, resultsCount: number) =>
      track('search', { query, results: resultsCount }),

    trackArtistClick: (artistName: string, artistId: string) =>
      track('artist_click', { name: artistName, id: artistId }),

    trackGroupClick: (groupName: string, groupId: string) =>
      track('group_click', { name: groupName, id: groupId }),

    trackProductionClick: (title: string, productionId: string, type: string) =>
      track('production_click', { title, id: productionId, type }),

    trackStreamingClick: (platform: string, contentTitle: string) =>
      track('streaming_click', { platform, title: contentTitle }),

    trackBlogRead: (slug: string, title: string) =>
      track('blog_read', { slug, title }),

    trackFilterApply: (filterType: string, value: string) =>
      track('filter_apply', { filter: filterType, value }),
  }
}
