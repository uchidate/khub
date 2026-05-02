'use client'

import Link from 'next/link'
import { useUmami } from '@/hooks/useUmami'
import { ArrowLeft, ArrowRight } from 'lucide-react'

interface Props {
    slug: string
    title: string
    direction: 'prev' | 'next'
    currentSlug: string
}

export function BlogNavLink({ slug, title, direction, currentSlug }: Props) {
    const { trackBlogNav } = useUmami()

    return (
        <Link
            href={`/blog/${slug}`}
            onClick={() => trackBlogNav(currentSlug, slug, direction)}
            className={`group flex flex-col gap-1.5 p-3 rounded-xl border border-border hover:border-accent/40 hover:bg-surface transition-all h-full${direction === 'next' ? ' text-right' : ''}`}
        >
            <span className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-muted${direction === 'next' ? ' justify-end' : ''}`}>
                {direction === 'prev' ? <><ArrowLeft size={10} /> Anterior</> : <>Próximo <ArrowRight size={10} /></>}
            </span>
            <span className="text-xs font-bold text-foreground group-hover:text-accent transition-colors line-clamp-2 leading-snug">
                {title}
            </span>
        </Link>
    )
}
