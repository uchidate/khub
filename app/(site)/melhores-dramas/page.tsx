import type { Metadata } from 'next'
import Link from 'next/link'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Tv, Film, Heart, Zap, Clock, Sparkles } from 'lucide-react'

export const metadata: Metadata = {
    title: 'Melhores K-Dramas e Filmes Coreanos | HallyuHub',
    description: 'Listas curadas dos melhores K-Dramas e filmes coreanos por plataforma, gênero e época. Encontre sua próxima série coreana para maratonar.',
}

const LISTS = [
    {
        href: '/melhores-dramas/netflix',
        icon: Tv,
        label: 'Melhores K-Dramas da Netflix',
        desc: 'Os títulos coreanos mais bem avaliados disponíveis na Netflix',
        color: 'text-red-400',
        bg: 'bg-red-400/10 border-red-400/20',
    },
    {
        href: '/melhores-dramas/romance',
        icon: Heart,
        label: 'Melhores K-Dramas de Romance',
        desc: 'Histórias de amor coreanas que vão fazer seu coração acelerar',
        color: 'text-pink-400',
        bg: 'bg-pink-400/10 border-pink-400/20',
    },
    {
        href: '/melhores-dramas/acao',
        icon: Zap,
        label: 'Melhores K-Dramas de Ação',
        desc: 'Thrillers e dramas de ação com reviravoltas surpreendentes',
        color: 'text-amber-400',
        bg: 'bg-amber-400/10 border-amber-400/20',
    },
    {
        href: '/melhores-dramas/classicos',
        icon: Clock,
        label: 'K-Dramas Clássicos Essenciais',
        desc: 'Os títulos históricos que todo fã precisa assistir',
        color: 'text-purple-400',
        bg: 'bg-purple-400/10 border-purple-400/20',
    },
    {
        href: '/melhores-dramas/filmes',
        icon: Film,
        label: 'Melhores Filmes Coreanos',
        desc: 'Do Oscar à Palma de Ouro — o melhor do cinema coreano',
        color: 'text-blue-400',
        bg: 'bg-blue-400/10 border-blue-400/20',
    },
]

export default function MelhoresDramasPage() {
    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 md:py-12">
                <Breadcrumbs items={[{ label: 'Melhores Dramas' }]} className="mb-6" />
                <div className="mb-10">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-accent" />
                        </div>
                        <h1 className="text-3xl font-black text-foreground tracking-tight">Melhores Dramas</h1>
                    </div>
                    <p className="text-muted text-sm max-w-xl">
                        Listas curadas dos melhores K-Dramas e filmes coreanos organizadas por plataforma, gênero e época.
                    </p>
                </div>

                <div className="space-y-3">
                    {LISTS.map(item => {
                        const Icon = item.icon
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="flex items-center gap-4 p-5 rounded-2xl border border-border bg-surface hover:border-accent/30 hover:bg-accent/5 transition-all group"
                            >
                                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 ${item.bg}`}>
                                    <Icon className={`w-5 h-5 ${item.color}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-foreground group-hover:text-accent transition-colors">{item.label}</p>
                                    <p className="text-xs text-muted mt-0.5">{item.desc}</p>
                                </div>
                                <span className="text-muted text-lg opacity-30 group-hover:opacity-70 transition-opacity">→</span>
                            </Link>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
