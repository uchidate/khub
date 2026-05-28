import prisma from '@/lib/prisma'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { cache } from 'react'
import type { Metadata } from 'next'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Calendar, Heart, List, BookOpen, Star } from 'lucide-react'
import { SITE_URL } from '@/lib/constants/site'

export const revalidate = 300

const getUser = cache(async (id: string) =>
    prisma.user.findUnique({
        where: { id },
        select: {
            id: true,
            name: true,
            image: true,
            bio: true,
            createdAt: true,
            _count: {
                select: {
                    favorites: true,
                    watchEntries: true,
                    comments: true,
                },
            },
            lists: {
                where: { isPublic: true },
                select: {
                    id: true,
                    name: true,
                    description: true,
                    updatedAt: true,
                    _count: { select: { items: true } },
                },
                orderBy: { updatedAt: 'desc' },
                take: 12,
            },
        },
    })
)

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params
    const user = await getUser(id)
    if (!user) return { title: 'Perfil não encontrado' }
    const name = user.name || 'Fã do Hallyu'
    return {
        title: `${name} | HallyuHub`,
        description: user.bio || `Perfil de ${name} no HallyuHub`,
        openGraph: {
            title: `${name} | HallyuHub`,
            description: user.bio || `Perfil de ${name} no HallyuHub`,
            url: `${SITE_URL}/u/${id}`,
            images: user.image ? [{ url: user.image, width: 400, height: 400, alt: name }] : [],
        },
    }
}

export default async function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const user = await getUser(id)
    if (!user) notFound()

    const name = user.name || 'Fã do Hallyu'
    const memberSince = new Date(user.createdAt).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

    return (
        <div className="page-wrap py-8 md:py-12 pb-[calc(var(--bottom-nav-h)+2rem)]">
            <Breadcrumbs items={[{ label: 'Perfil', href: '#' }, { label: name }]} />

            {/* Header */}
            <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center gap-5 mb-8">
                {user.image ? (
                    <Image src={user.image} alt={name} width={80} height={80} className="rounded-full object-cover ring-2 ring-border" />
                ) : (
                    <div className="w-20 h-20 rounded-full bg-accent flex items-center justify-center text-white text-2xl font-black flex-shrink-0">
                        {name[0].toUpperCase()}
                    </div>
                )}
                <div className="flex-1">
                    <h1 className="text-title font-black text-foreground">{name}</h1>
                    {user.bio && <p className="text-body text-muted mt-1 max-w-xl">{user.bio}</p>}
                    <div className="flex items-center gap-1.5 mt-2 text-caption text-muted">
                        <Calendar className="w-3 h-3" />
                        Membro desde {memberSince}
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-10">
                {[
                    { icon: Heart, label: 'Favoritos', value: user._count.favorites },
                    { icon: BookOpen, label: 'Assistidos', value: user._count.watchEntries },
                    { icon: Star, label: 'Comentários', value: user._count.comments },
                ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="bg-surface border border-border rounded-xl p-4 flex flex-col items-center gap-1">
                        <Icon className="w-5 h-5 text-accent mb-0.5" />
                        <span className="text-title font-black text-foreground">{value}</span>
                        <span className="text-caption text-muted">{label}</span>
                    </div>
                ))}
            </div>

            {/* Listas públicas */}
            <div>
                <h2 className="text-subtitle font-black text-foreground mb-4 flex items-center gap-2">
                    <List className="w-5 h-5 text-accent" />
                    Listas públicas
                </h2>
                {user.lists.length === 0 ? (
                    <p className="text-muted text-body py-8 text-center">Nenhuma lista pública.</p>
                ) : (
                    <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {user.lists.map(list => (
                            <Link
                                key={list.id}
                                href={`/lists/${list.id}`}
                                className="group bg-surface border border-border hover:border-border-strong rounded-xl p-4 transition-all hover:-translate-y-0.5"
                            >
                                <h3 className="text-small font-black text-foreground group-hover:text-accent transition-colors line-clamp-1 mb-1">
                                    {list.name}
                                </h3>
                                {list.description && (
                                    <p className="text-caption text-muted line-clamp-2 mb-2">{list.description}</p>
                                )}
                                <span className="text-caption text-muted">{list._count.items} item{list._count.items !== 1 ? 's' : ''}</span>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
