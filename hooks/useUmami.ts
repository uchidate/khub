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

    trackScrollDepth: (depth: 25 | 50 | 75 | 100, slug: string) =>
      track('scroll_depth', { depth, slug }),

    trackQuizStart: () =>
      track('quiz_start'),

    trackQuizAnswer: (correct: boolean, questionIndex: number) =>
      track('quiz_answer', { correct, question: questionIndex }),

    trackQuizComplete: (score: number, total: number) =>
      track('quiz_complete', { score, total, pct: Math.round((score / total) * 100) }),

    trackBlogNav: (from: string, to: string, direction: 'prev' | 'next') =>
      track('blog_nav', { from, to, direction }),

    trackAdClick: (variant: string, position: string) =>
      track('ad_click', { variant, position }),
  }
}
