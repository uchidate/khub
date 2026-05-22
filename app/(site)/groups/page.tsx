import { Suspense } from "react"
import type { Metadata } from "next"
import { PHASE_PRODUCTION_BUILD } from 'next/constants'
import { PageTransition } from "@/components/features/PageTransition"
import { GroupsList } from "@/components/features/GroupsList"
import { ScrollToTop } from "@/components/ui/ScrollToTop"
import { JsonLd } from "@/components/seo/JsonLd"
import prisma from "@/lib/prisma"

export const revalidate = 600

import { SITE_URL } from '@/lib/constants/site'
const BASE_URL = SITE_URL

export async function generateMetadata(): Promise<Metadata> {
    if (process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD) {
        return {
            title: 'Grupos K-Pop',
            description: 'BTS, BLACKPINK, TWICE e muito mais — perfis completos de grupos K-Pop com formação, discografia e trajetória na indústria coreana.',
            keywords: 'grupos K-Pop, K-Pop, BTS, BLACKPINK, TWICE, idol coreano, fanclub, fandom, bias, comeback, HallyuHub',
            alternates: { canonical: `${BASE_URL}/groups`, languages: { 'pt-BR': `${BASE_URL}/groups`, 'x-default': `${BASE_URL}/groups` } },
        }
    }
    const total = await prisma.musicalGroup.count({ where: { isHidden: false } }).catch(() => 0)
    const desc = `${total > 0 ? `${total} ` : ''}grupos K-Pop com perfis completos — formação, integrantes, fanclub, discografia e trajetória na indústria coreana, em português.`
    return {
        title: 'Grupos K-Pop',
        description: desc,
        keywords: 'grupos K-Pop, K-Pop, BTS, BLACKPINK, TWICE, idol coreano, fanclub, fandom, bias, comeback, HallyuHub',
        alternates: { canonical: `${BASE_URL}/groups`, languages: { 'pt-BR': `${BASE_URL}/groups`, 'x-default': `${BASE_URL}/groups` } },
        openGraph: {
            title: 'Grupos K-Pop | HallyuHub',
            description: desc,
            url: `${BASE_URL}/groups`,
        },
    }
}

export default async function GroupsPage() {
    if (process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD) return <Suspense><GroupsList /></Suspense>
    const [heroGroups, listGroups] = await Promise.all([
        prisma.musicalGroup.findMany({
            where: { isHidden: false, profileImageUrl: { not: null } },
            orderBy: { trendingScore: 'desc' },
            take: 5,
            select: {
                id: true, slug: true, name: true, nameHangul: true, profileImageUrl: true,
                debutDate: true, fanClubName: true, trendingScore: true,
                _count: { select: { members: { where: { isActive: true } } } },
            },
        }).catch(() => []),
        prisma.musicalGroup.findMany({
            where: { isHidden: false },
            select: {
                id: true,
                slug: true,
                name: true,
                nameHangul: true,
                profileImageUrl: true,
                debutDate: true,
                disbandDate: true,
                agency: { select: { id: true, name: true } },
                _count: { select: { members: true } },
                viewCount: true,
                trendingScore: true,
            },
            orderBy: { name: 'asc' },
        }).catch(() => []),
    ])
    const initialGroups = listGroups.map(group => ({
        ...group,
        debutDate: group.debutDate ? group.debutDate.toISOString() : null,
        disbandDate: group.disbandDate ? group.disbandDate.toISOString() : null,
    }))

    return (
        <>
        <JsonLd data={{
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": "Grupos K-Pop | HallyuHub",
            "description": "Explore grupos de K-Pop, suas gerações, formações e trajetórias na indústria coreana.",
            "url": `${BASE_URL}/groups`,
            "inLanguage": "pt-BR",
            "publisher": { "@type": "Organization", "name": "HallyuHub", "url": BASE_URL },
        }} />
        {heroGroups.length > 0 && (
            <JsonLd data={{
                "@context": "https://schema.org",
                "@type": "ItemList",
                "name": "Grupos K-Pop em Destaque",
                "url": `${BASE_URL}/groups`,
                "numberOfItems": heroGroups.length,
                "itemListElement": heroGroups.map((g, i) => ({
                    "@type": "ListItem",
                    "position": i + 1,
                    "url": `${BASE_URL}/groups/${g.slug ?? g.id}`,
                    "name": g.name,
                })),
            }} />
        )}
        <PageTransition className="pb-16">
            <Suspense>
                <GroupsList initialGroups={initialGroups} />
            </Suspense>
            <ScrollToTop />
        </PageTransition>
        </>
    )
}
