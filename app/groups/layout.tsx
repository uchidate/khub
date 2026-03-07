import type { Metadata } from 'next'
import { PHASE_PRODUCTION_BUILD } from 'next/constants'
import prisma from '@/lib/prisma'

const BASE_URL = 'https://www.hallyuhub.com.br'

export async function generateMetadata(): Promise<Metadata> {
    if (process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD) {
        return { title: 'Grupos Musicais', description: 'Explore grupos musicais de K-Pop. Conheça a discografia, os membros e a história de cada grupo.' }
    }
    const total = await prisma.musicalGroup.count().catch(() => 0)
    const desc = `Explore ${total > 0 ? `${total} ` : ''}grupos musicais de K-Pop. Conheça a discografia, os membros e a história de cada grupo.`
    return {
        title: 'Grupos Musicais',
        description: desc,
        alternates: { canonical: `${BASE_URL}/groups` },
        openGraph: {
            title: 'Grupos Musicais K-Pop | HallyuHub',
            description: desc,
            url: `${BASE_URL}/groups`,
        },
    }
}

export default function GroupsLayout({ children }: { children: React.ReactNode }) {
    return children
}
