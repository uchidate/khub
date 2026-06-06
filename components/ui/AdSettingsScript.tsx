import prisma from '@/lib/prisma'

const DEFAULTS = { adsGloballyPaused: false, adsAutoAdsEnabled: true, adsMultiplexEnabled: true, adsSidebarEnabled: true }

// Server Component — injeta window.__adSettings no cliente uma vez por page load.
// Skip durante build (SKIP_BUILD_STATIC_GENERATION) — DB não está disponível no builder.
// isAdmin NÃO é lido aqui: auth() quebraria SSG em /groups, /artists etc.
// AdBanner usa useSession() diretamente para o check de admin.
export async function AdSettingsScript() {
    if (process.env.SKIP_BUILD_STATIC_GENERATION) {
        return <script suppressHydrationWarning dangerouslySetInnerHTML={{ __html: `window.__adSettings=${JSON.stringify(DEFAULTS)};` }} />
    }

    let settings = { ...DEFAULTS }
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
