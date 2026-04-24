'use client'

import Image, { type ImageProps } from 'next/image'
import { useState } from 'react'

interface SafeImageProps extends Omit<ImageProps, 'onError'> {
  fallback?: React.ReactNode
}

/**
 * Next.js Image with automatic fallback on load error.
 * Use when src comes from external URLs that may expire or be unavailable.
 */
export function SafeImage({ fallback, className, ...props }: SafeImageProps) {
  const [failed, setFailed] = useState(false)

  if (failed) return <>{fallback ?? null}</>

  return (
    <Image
      {...props}
      className={className}
      onError={() => setFailed(true)}
    />
  )
}
