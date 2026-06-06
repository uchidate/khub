import prisma from '@/lib/prisma'

// Server Component — injeta window.__adSettings no cliente uma vez por page load.
// isAdmin NÃO é lido aqui (auth() quebraria SSG em /groups, /artists etc).
// O AdBannerAdminGuard (client component) lê a sessão e zera os ads para admins.
export async function AdSettingsScript() {
    let settings = { adsGloballyPaused: false, adsAutoAdsEnabled: true, adsMultiplexEnabled: true, adsSidebarEnabled: true }
    try {
        const row = await prisma.systemSettings.findUnique({ where: { id: 'singleton' } })
        if (row) {
            settings = {
                adsGloballyPaused:   row.adsGloballyPaused   ?? false,
                adsAutoAdsEnabled:   row.adsAutoAdsEnabled   ?? true,
                adsMultiplexEnabled: row.adsMultiplexEnabled ?? true,
                adsSidebarEnabled:   row.adsSidebarEnabled   ?? true,
            }
        }
    } catch { /* fallback to defaults on DB error */ }

    return (
        <script
            suppressHydrationWarning
            dangerouslySetInnerHTML={{ __html: `window.__adSettings=${JSON.stringify(settings)};` }}
        />
    )
}
