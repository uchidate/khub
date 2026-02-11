import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { PageTransition } from '@/components/features/PageTransition'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { NotificationSettings } from '@/components/features/NotificationSettings'
import { Loader2 } from 'lucide-react'

export const metadata = {
    title: 'Configurações de Notificações',
    description: 'Gerencie suas preferências de notificações por email',
}

function LoadingSkeleton() {
    return (
        <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
        </div>
    )
}

async function NotificationSettingsContent() {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
        redirect('/auth/login?callbackUrl=/settings/notifications')
    }

    // Buscar usuário com configurações
    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: {
            notificationSettings: true,
            favorites: {
                where: { artistId: { not: null } },
                select: {
                    artist: {
                        select: {
                            id: true,
                            nameRomanized: true,
                        },
                    },
                },
            },
        },
    })

    if (!user) {
        redirect('/auth/login')
    }

    // Se não tem configurações, criar padrão
    let settings = user.notificationSettings

    if (!settings) {
        settings = await prisma.userNotificationSettings.create({
            data: {
                userId: user.id,
                emailOnNewNews: true,
                emailDigestEnabled: true,
                emailDigestFrequency: 'DAILY',
                emailDigestTime: '09:00',
                onlyFavoriteArtists: true,
                minNewsImportance: 'ALL',
            },
        })
    }

    const favoriteArtists = user.favorites
        .filter(f => f.artist)
        .map(f => f.artist!.nameRomanized)

    return (
        <NotificationSettings
            settings={settings}
            favoriteArtistsCount={favoriteArtists.length}
            favoriteArtists={favoriteArtists.slice(0, 5)}
        />
    )
}

export default async function NotificationSettingsPage() {
    return (
        <PageTransition className="pt-24 md:pt-32 pb-20 px-4 sm:px-12 md:px-20 max-w-4xl mx-auto">
            <SectionHeader
                title="Configurações de Notificações"
                subtitle="Gerencie como e quando você quer receber notícias sobre seus artistas favoritos"
            />

            <Suspense fallback={<LoadingSkeleton />}>
                <NotificationSettingsContent />
            </Suspense>
        </PageTransition>
    )
}
