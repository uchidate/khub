'use client'

import { useState } from 'react'
import Image, { type ImageProps } from 'next/image'

interface ImageWithFallbackProps extends Omit<ImageProps, 'onError'> {
  fallback?: React.ReactNode
}

export function ImageWithFallback({ fallback, src, alt, ...props }: ImageWithFallbackProps) {
  const [failed, setFailed] = useState(false)

  if (failed) return <>{fallback ?? null}</>

  return (
    <Image
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
      {...props}
    />
  )
}
