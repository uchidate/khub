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
    title: 'Alertas',
    description: 'Gerencie seus alertas do HallyuHub',
}

function LoadingSkeleton() {
    return (
        <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#ff2d78] animate-spin" />
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
        include: { notificationSettings: true },
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
                emailOnNewBlog: true,
                emailDigestEnabled: true,
                emailDigestFrequency: 'DAILY',
                emailDigestTime: '09:00',
            },
        })
    }

    return (
        <NotificationSettings settings={settings} />
    )
}

export default async function NotificationSettingsPage() {
    return (
        <PageTransition className="mx-auto max-w-5xl px-4 py-5 pb-12 sm:px-6 lg:px-8">
            <SectionHeader
                title="Alertas"
                subtitle="Controle o que chega no sininho e nos emails do HallyuHub."
            />

            <Suspense fallback={<LoadingSkeleton />}>
                <NotificationSettingsContent />
            </Suspense>
        </PageTransition>
    )
}
