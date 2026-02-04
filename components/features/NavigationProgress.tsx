'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Suspense } from 'react'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'

// Configure NProgress
NProgress.configure({
  showSpinner: false,
  trickleSpeed: 200,
  minimum: 0.08,
  easing: 'ease',
  speed: 500
})

function NavigationProgressInner() {
  const pathname = usePathname()

  useEffect(() => {
    // Complete the progress bar when pathname changes
    NProgress.done()
  }, [pathname])

  useEffect(() => {
    // Start progress bar on mount
    NProgress.start()

    // Cleanup function
    return () => {
      NProgress.done()
    }
  }, [])

  // This component renders nothing
  return null
}

export function NavigationProgress() {
  return (
    <Suspense fallback={null}>
      <NavigationProgressInner />
    </Suspense>
  )
}
