import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'

// Server Component — injeta window.__adSettings no cliente uma vez por page load
export async function AdSettingsScript() {
    let settings = { adsGloballyPaused: false, adsAutoAdsEnabled: true, adsMultiplexEnabled: true, adsSidebarEnabled: true, isAdmin: false }
    try {
        const [row, session] = await Promise.all([
            prisma.systemSettings.findUnique({ where: { id: 'singleton' } }),
            auth(),
        ])
        if (row) {
            settings = {
                adsGloballyPaused:   row.adsGloballyPaused   ?? false,
                adsAutoAdsEnabled:   row.adsAutoAdsEnabled   ?? true,
                adsMultiplexEnabled: row.adsMultiplexEnabled ?? true,
                adsSidebarEnabled:   row.adsSidebarEnabled   ?? true,
                isAdmin: session?.user?.role?.toLowerCase() === 'admin',
            }
        } else {
            settings.isAdmin = session?.user?.role?.toLowerCase() === 'admin'
        }
    } catch { /* fallback to defaults on DB error */ }

    return (
        <script
            suppressHydrationWarning
            dangerouslySetInnerHTML={{ __html: `window.__adSettings=${JSON.stringify(settings)};` }}
        />
    )
}
