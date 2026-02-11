import type { Metadata } from "next"
import { SectionHeader } from "@/components/ui/SectionHeader"
import { PageTransition } from "@/components/features/PageTransition"
import { ArtistsList } from "@/components/features/ArtistsList"

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
    title: 'Artistas',
    description: 'Explore perfis detalhados de artistas de K-Pop e K-Drama, suas carreiras, obras e novidades.',
}

export default async function ArtistsPage() {
    return (
        <PageTransition className="pt-24 md:pt-32 pb-20 px-4 sm:px-12 md:px-20">
            <SectionHeader
                title="Artistas"
                subtitle="Os ícones, as vozes e o talento. Explore perfis detalhados das estrelas que definem a cultura coreana."
            />

            <ArtistsList />
        </PageTransition>
    )
}
