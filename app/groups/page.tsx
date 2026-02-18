import prisma from '@/lib/prisma'
import Link from 'next/link'
import Image from 'next/image'
import { Users } from 'lucide-react'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
    title: 'Grupos Musicais - HallyuHub',
    description: 'Descubra os grupos musicais do K-pop: BTS, BLACKPINK, EXO e muito mais.',
}

export default async function GroupsPage() {
    const groups = await prisma.musicalGroup.findMany({
        include: {
            agency: { select: { id: true, name: true } },
            _count: { select: { members: true } },
        },
        orderBy: { name: 'asc' },
    })

    const active = groups.filter(g => !g.disbandDate)
    const disbanded = groups.filter(g => !!g.disbandDate)

    return (
        <div className="pt-24 md:pt-32 pb-20 px-4 sm:px-12 md:px-20">
            {/* Header */}
            <div className="mb-12">
                <div className="flex items-center gap-3 mb-4">
                    <Users className="w-5 h-5 text-purple-400" />
                    <p className="text-xs font-black text-zinc-600 uppercase tracking-widest">K-pop</p>
                </div>
                <h1 className="text-5xl md:text-7xl font-black hallyu-gradient-text uppercase tracking-tighter italic">
                    Grupos Musicais
                </h1>
                <p className="text-zinc-500 font-medium mt-3">
                    {active.length} grupo{active.length !== 1 ? 's' : ''} ativo{active.length !== 1 ? 's' : ''}
                    {disbanded.length > 0 && ` · ${disbanded.length} disbandado${disbanded.length !== 1 ? 's' : ''}`}
                </p>
            </div>

            {/* Active groups */}
            {active.length > 0 && (
                <section className="mb-16">
                    <h2 className="text-xs font-black text-zinc-600 uppercase tracking-widest mb-6">Ativos</h2>
                    <GroupGrid groups={active} />
                </section>
            )}

            {/* Disbanded groups */}
            {disbanded.length > 0 && (
                <section>
                    <h2 className="text-xs font-black text-zinc-600 uppercase tracking-widest mb-6">Disbandados</h2>
                    <GroupGrid groups={disbanded} faded />
                </section>
            )}

            {groups.length === 0 && (
                <div className="text-center py-32">
                    <p className="text-zinc-600 font-bold text-lg">Nenhum grupo cadastrado ainda</p>
                    <p className="text-zinc-700 text-sm mt-2">Sincronize via Admin → Grupos Musicais</p>
                </div>
            )}
        </div>
    )
}

function GroupGrid({
    groups,
    faded = false,
}: {
    groups: {
        id: string
        name: string
        nameHangul: string | null
        profileImageUrl: string | null
        debutDate: Date | null
        disbandDate: Date | null
        agency: { id: string; name: string } | null
        _count: { members: number }
    }[]
    faded?: boolean
}) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {groups.map(group => (
                <Link
                    key={group.id}
                    href={`/groups/${group.id}`}
                    className={`group block ${faded ? 'opacity-60 hover:opacity-100 transition-opacity' : ''}`}
                >
                    <div className="aspect-square relative rounded-xl overflow-hidden bg-zinc-900 border border-white/5 card-hover mb-3">
                        {group.profileImageUrl ? (
                            <Image
                                src={group.profileImageUrl}
                                alt={group.name}
                                fill
                                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
                                className="object-cover group-hover:scale-105 transition-transform duration-500 brightness-90 group-hover:brightness-100"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900">
                                <span className="text-3xl font-black text-zinc-600 group-hover:text-purple-500 transition-colors">
                                    {group.name[0]}
                                </span>
                            </div>
                        )}
                        {group.disbandDate && (
                            <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/60 backdrop-blur-sm rounded text-[10px] font-black text-zinc-400 uppercase tracking-wider">
                                Disbandado
                            </div>
                        )}
                    </div>
                    <div>
                        <h3 className="font-black text-white text-sm leading-tight group-hover:text-purple-300 transition-colors">{group.name}</h3>
                        {group.nameHangul && (
                            <p className="text-xs text-zinc-500 font-medium mt-0.5">{group.nameHangul}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1.5">
                            {group.debutDate && (
                                <span className="text-[10px] font-bold text-zinc-600">{new Date(group.debutDate).getFullYear()}</span>
                            )}
                            {group._count.members > 0 && (
                                <span className="text-[10px] font-bold text-zinc-600">{group._count.members} membros</span>
                            )}
                        </div>
                    </div>
                </Link>
            ))}
        </div>
    )
}
