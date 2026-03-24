import type { Metadata } from 'next'
import { PHASE_PRODUCTION_BUILD } from 'next/constants'
import prisma from '@/lib/prisma'

import { SITE_URL } from '@/lib/constants/site'
const BASE_URL = SITE_URL

export async function generateMetadata(): Promise<Metadata> {
    if (process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD) {
        return { title: 'Grupos K-Pop', description: 'BTS, BLACKPINK, TWICE e muito mais — perfis completos de grupos K-Pop com formação, discografia e trajetória na indústria coreana.' }
    }
    const total = await prisma.musicalGroup.count().catch(() => 0)
    const desc = `${total > 0 ? `${total} ` : ''}grupos K-Pop com perfis completos — formação, discografia, fandom e trajetória na indústria coreana, em português.`
    return {
        title: 'Grupos K-Pop',
        description: desc,
        alternates: { canonical: `${BASE_URL}/groups` },
        openGraph: {
            title: 'Grupos K-Pop | HallyuHub',
            description: desc,
            url: `${BASE_URL}/groups`,
        },
    }
}

export default function GroupsLayout({ children }: { children: React.ReactNode }) {
    return children
}
