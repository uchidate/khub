'use client'

import { useState } from 'react'
import { BookOpen } from 'lucide-react'

interface BlogImageProps {
  src: string | null | undefined
  alt: string
  fill?: boolean
  sizes?: string
  priority?: boolean
  unoptimized?: boolean
  width?: number
  height?: number
  className?: string
  fallbackGradient?: string
  aspectRatio?: 'video' | 'square' | 'thumb'
}

export function BlogImage({
  src,
  alt,
  fill,
  priority,
  width,
  height,
  className,
  fallbackGradient = 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
  aspectRatio,
}: BlogImageProps) {
  const [failed, setFailed] = useState(false)

  const fillStyle = fill
    ? { position: 'absolute' as const, inset: 0, width: '100%', height: '100%', objectFit: 'cover' as const }
    : undefined

  if (!src || failed) {
    const fallbackCls = fill ? 'absolute inset-0' : ''
    const fallbackStyle = fill
      ? { background: fallbackGradient }
      : { width: width ?? '100%', height: height ?? '100%', background: fallbackGradient, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8 }
    return (
      <div className={`flex items-center justify-center ${fallbackCls}`} style={fallbackStyle}>
        <BookOpen className="opacity-10 text-white" size={aspectRatio === 'thumb' ? 14 : 24} />
      </div>
    )
  }

  const sizeStyle = !fill && width && height
    ? { width, height, minWidth: width, minHeight: height, objectFit: 'cover' as const }
    : undefined

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      loading={priority ? 'eager' : 'lazy'}
      decoding={priority ? 'sync' : 'async'}
      className={className}
      style={fillStyle ?? sizeStyle}
      onError={() => setFailed(true)}
    />
  )
}
