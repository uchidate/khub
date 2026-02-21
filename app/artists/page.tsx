import type { Metadata } from "next"
import { SectionHeader } from "@/components/ui/SectionHeader"
import { PageTransition } from "@/components/features/PageTransition"
import { ArtistsList } from "@/components/features/ArtistsList"
import { ScrollToTop } from "@/components/ui/ScrollToTop"
import prisma from "@/lib/prisma"

export const dynamic = 'force-dynamic'

const BASE_URL = 'https://www.hallyuhub.com.br'

export async function generateMetadata(): Promise<Metadata> {
    const total = await prisma.artist.count({ where: { flaggedAsNonKorean: false } }).catch(() => 0)
    const desc = `Explore ${total > 0 ? `${total} ` : ''}perfis de artistas de K-Pop e K-Drama, suas carreiras, obras e novidades.`
    return {
        title: 'Artistas',
        description: desc,
        alternates: { canonical: `${BASE_URL}/artists` },
        openGraph: {
            title: 'Artistas K-Pop & K-Drama | HallyuHub',
            description: desc,
            url: `${BASE_URL}/artists`,
        },
    }
}

export default async function ArtistsPage() {
    return (
        <PageTransition className="pt-24 md:pt-32 pb-20 px-4 sm:px-12 md:px-20">
            <SectionHeader
                title="Artistas"
                subtitle="Os ícones, as vozes e o talento. Explore perfis detalhados das estrelas que definem a cultura coreana."
            />

            <ArtistsList />
            <ScrollToTop />
        </PageTransition>
    )
}
