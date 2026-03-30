import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Buscar - HallyuHub',
    description: 'Pesquise artistas, grupos, dramas e filmes coreanos no HallyuHub.',
    robots: { index: false, follow: true },
}

export default function SearchLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
