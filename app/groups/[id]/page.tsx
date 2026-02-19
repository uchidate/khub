import prisma from '@/lib/prisma'
import Image from 'next/image'
import Link from 'next/link'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { JsonLd } from '@/components/seo/JsonLd'
import { Globe, Users } from 'lucide-react'
import type { Metadata } from 'next'

const BASE_URL = 'https://www.hallyuhub.com.br'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
    const group = await prisma.musicalGroup.findUnique({ where: { id: params.id } })
    if (!group) return { title: 'Grupo não encontrado - HallyuHub' }
    const description = group.bio || `${group.name}${group.nameHangul ? ` (${group.nameHangul})` : ''} - Grupo musical K-pop`
    const isThinContent = !group.profileImageUrl && !group.bio
    return {
        title: `${group.name} - HallyuHub`,
        description: description.slice(0, 160),
        alternates: {
            canonical: `${BASE_URL}/groups/${params.id}`,
        },
        ...(isThinContent ? { robots: { index: false, follow: true } } : {}),
        openGraph: {
            title: `${group.name} - HallyuHub`,
            description: description.slice(0, 160),
            images: group.profileImageUrl ? [{
                url: group.profileImageUrl,
                width: 1200,
                height: 630,
                alt: group.name,
            }] : [],
            type: 'website',
            url: `${BASE_URL}/groups/${params.id}`,
        },
        twitter: {
            card: 'summary_large_image',
            title: `${group.name} - HallyuHub`,
            description: description.slice(0, 160),
            images: group.profileImageUrl ? [group.profileImageUrl] : [],
        },
    }
}

export default async function GroupDetailPage({ params }: { params: { id: string } }) {
    const group = await prisma.musicalGroup.findUnique({
        where: { id: params.id },
        include: {
            agency: true,
            members: {
                include: {
                    artist: {
                        select: {
                            id: true,
                            nameRomanized: true,
                            nameHangul: true,
                            primaryImageUrl: true,
                            roles: true,
                        },
                    },
                },
                orderBy: [{ isActive: 'desc' }, { position: 'asc' }, { joinDate: 'asc' }],
            },
        },
    })

    if (!group) {
        return (
            <div className="pt-24 md:pt-32 pb-20 px-4 sm:px-12 md:px-20">
                <Breadcrumbs items={[{ label: 'Grupos', href: '/groups' }, { label: 'Não Encontrado' }]} />
                <ErrorMessage
                    title="Grupo não encontrado"
                    message="Este grupo pode ter sido removido ou o link está incorreto."
                    showSupport={true}
                />
            </div>
        )
    }

    const activeMembers = group.members.filter(m => m.isActive)
    const formerMembers = group.members.filter(m => !m.isActive)
    const debutYear = group.debutDate ? new Date(group.debutDate).getFullYear() : null
    const disbandYear = group.disbandDate ? new Date(group.disbandDate).getFullYear() : null
    const socialLinks = (group.socialLinks as Record<string, string>) || {}

    const memberPersons = activeMembers.slice(0, 15).map(m => ({
        "@type": "Person",
        "name": m.artist.nameRomanized,
        "url": `${BASE_URL}/artists/${m.artist.id}`,
    }))

    return (
        <div className="min-h-screen">
            <JsonLd data={{
                "@context": "https://schema.org",
                "@type": "MusicGroup",
                "name": group.name,
                "alternateName": group.nameHangul ?? undefined,
                "description": group.bio?.slice(0, 300) ?? undefined,
                "image": group.profileImageUrl ?? undefined,
                "url": `${BASE_URL}/groups/${group.id}`,
                ...(debutYear ? { "foundingDate": String(debutYear) } : {}),
                ...(disbandYear ? { "dissolutionDate": String(disbandYear) } : {}),
                ...(group.agency ? { "memberOf": { "@type": "Organization", "name": group.agency.name } } : {}),
                ...(memberPersons.length ? { "member": memberPersons } : {}),
            }} />
            <JsonLd data={{
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                "itemListElement": [
                    { "@type": "ListItem", "position": 1, "name": "Grupos", "item": `${BASE_URL}/groups` },
                    { "@type": "ListItem", "position": 2, "name": group.name, "item": `${BASE_URL}/groups/${group.id}` },
                ],
            }} />
            {/* Hero */}
            <div className="relative h-[50vh] md:h-[60vh]">
                {group.profileImageUrl ? (
                    <Image
                        src={group.profileImageUrl}
                        alt={group.name}
                        fill
                        priority
                        sizes="100vw"
                        className="object-cover"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-900/40 via-zinc-900 to-zinc-900" />
                )}
                <div className="absolute inset-0 hero-gradient" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/30 to-transparent" />

                {/* Breadcrumbs */}
                <div className="absolute top-24 md:top-32 left-0 right-0 px-4 sm:px-12 md:px-20">
                    <Breadcrumbs items={[
                        { label: 'Grupos', href: '/groups' },
                        { label: group.name }
                    ]} />
                </div>

                {/* Hero content */}
                <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-12 md:px-20 pb-10 md:pb-16">
                    {disbandYear && (
                        <span className="inline-block text-xs font-black uppercase px-2 py-0.5 bg-zinc-700 text-zinc-300 rounded mb-3">
                            Disbandado em {disbandYear}
                        </span>
                    )}
                    <h1 className="text-5xl md:text-8xl font-black text-white leading-none tracking-tighter">{group.name}</h1>
                    {group.nameHangul && (
                        <p className="text-xl md:text-2xl text-purple-500 font-bold mt-1">{group.nameHangul}</p>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="px-4 sm:px-12 md:px-20 py-16">
                <div className="grid md:grid-cols-3 gap-16">
                    {/* Sidebar */}
                    <div className="space-y-8">
                        {group.bio && (
                            <div>
                                <h3 className="text-xs font-black text-zinc-600 uppercase tracking-widest mb-3">Sobre</h3>
                                <p className="text-zinc-400 leading-relaxed font-medium">{group.bio}</p>
                            </div>
                        )}

                        <div className="space-y-0">
                            {debutYear && (
                                <div className="flex justify-between py-3 border-b border-white/5 group">
                                    <div className="flex items-center gap-2">
                                        <Users className="w-3.5 h-3.5 text-zinc-600 group-hover:text-purple-500 transition-colors" />
                                        <span className="text-xs font-black text-zinc-600 uppercase tracking-widest">Debut</span>
                                    </div>
                                    <span className="text-sm font-bold text-zinc-300">{debutYear}</span>
                                </div>
                            )}
                            {group.agency && (
                                <div className="flex justify-between py-3 border-b border-white/5 group">
                                    <div className="flex items-center gap-2">
                                        <Globe className="w-3.5 h-3.5 text-zinc-600 group-hover:text-purple-500 transition-colors" />
                                        <span className="text-xs font-black text-zinc-600 uppercase tracking-widest">Agência</span>
                                    </div>
                                    <Link href={`/agencies/${group.agency.id}`} className="text-sm font-bold text-purple-500 hover:text-purple-400 transition-colors">
                                        {group.agency.name}
                                    </Link>
                                </div>
                            )}
                            <div className="flex justify-between py-3 border-b border-white/5 group">
                                <div className="flex items-center gap-2">
                                    <Users className="w-3.5 h-3.5 text-zinc-600 group-hover:text-purple-500 transition-colors" />
                                    <span className="text-xs font-black text-zinc-600 uppercase tracking-widest">Membros ativos</span>
                                </div>
                                <span className="text-sm font-bold text-zinc-300">{activeMembers.length}</span>
                            </div>
                            {disbandYear && (
                                <div className="flex justify-between py-3 border-b border-white/5 group">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-black text-zinc-600 uppercase tracking-widest">Disbandado</span>
                                    </div>
                                    <span className="text-sm font-bold text-zinc-300">{disbandYear}</span>
                                </div>
                            )}
                        </div>

                        {Object.keys(socialLinks).length > 0 && (
                            <div>
                                <h3 className="text-xs font-black text-zinc-600 uppercase tracking-widest mb-3">Redes Sociais</h3>
                                <div className="flex flex-col gap-2">
                                    {Object.entries(socialLinks).map(([key, url]) => (
                                        <a key={key} href={url} target="_blank" rel="noopener noreferrer"
                                            className="flex items-center justify-between px-4 py-3 rounded-xl bg-zinc-900/50 border border-white/5 hover:border-purple-500/30 transition-all">
                                            <span className="text-sm font-bold text-white capitalize">{key}</span>
                                            <span className="text-xs text-zinc-500">→</span>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Main content */}
                    <div className="md:col-span-2 space-y-16">
                        {/* Active members */}
                        {activeMembers.length > 0 && (
                            <div>
                                <h2 className="text-xs font-black text-zinc-600 uppercase tracking-widest mb-6">Membros</h2>
                                <MemberGrid members={activeMembers} />
                            </div>
                        )}

                        {/* Former members */}
                        {formerMembers.length > 0 && (
                            <div>
                                <h2 className="text-xs font-black text-zinc-600 uppercase tracking-widest mb-6">Ex-Membros</h2>
                                <MemberGrid members={formerMembers} faded />
                            </div>
                        )}

                        {group.members.length === 0 && (
                            <div className="bg-zinc-900 rounded-xl border border-white/5 p-12 text-center">
                                <Users className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                                <p className="text-zinc-500 font-bold">Nenhum membro vinculado</p>
                                <p className="text-zinc-700 text-sm mt-1">Sincronize via Admin → Grupos Musicais</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

function MemberGrid({
    members,
    faded = false,
}: {
    members: {
        id: string
        role: string | null
        joinDate: Date | null
        leaveDate: Date | null
        artist: {
            id: string
            nameRomanized: string
            nameHangul: string | null
            primaryImageUrl: string | null
            roles: string[]
        }
    }[]
    faded?: boolean
}) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {members.map(member => (
                <Link
                    key={member.id}
                    href={`/artists/${member.artist.id}`}
                    className={`group block ${faded ? 'opacity-60 hover:opacity-100 transition-opacity' : ''}`}
                >
                    <div className="aspect-[3/4] relative rounded-lg overflow-hidden bg-zinc-900 border border-white/5 card-hover mb-2">
                        {member.artist.primaryImageUrl ? (
                            <Image
                                src={member.artist.primaryImageUrl}
                                alt={member.artist.nameRomanized}
                                fill
                                sizes="(max-width: 640px) 50vw, 25vw"
                                className="object-cover group-hover:scale-105 transition-transform duration-500 brightness-80 group-hover:brightness-100"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                                <span className="text-2xl font-black text-zinc-600 group-hover:text-purple-400 transition-colors">
                                    {member.artist.nameRomanized[0]}
                                </span>
                            </div>
                        )}
                        {member.role && (
                            <div className="absolute bottom-2 left-2 right-2">
                                <span className="text-[10px] font-black uppercase px-1.5 py-0.5 bg-black/60 backdrop-blur-sm text-purple-300 rounded">
                                    {member.role}
                                </span>
                            </div>
                        )}
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-sm leading-tight group-hover:text-purple-300 transition-colors">
                            {member.artist.nameRomanized}
                        </h3>
                        {member.artist.nameHangul && (
                            <p className="text-[11px] text-zinc-500 mt-0.5">{member.artist.nameHangul}</p>
                        )}
                        {(member.joinDate || member.leaveDate) && (
                            <p className="text-[10px] text-zinc-600 mt-1">
                                {member.joinDate ? new Date(member.joinDate).getFullYear() : '?'}
                                {member.leaveDate ? ` – ${new Date(member.leaveDate).getFullYear()}` : ''}
                            </p>
                        )}
                    </div>
                </Link>
            ))}
        </div>
    )
}
