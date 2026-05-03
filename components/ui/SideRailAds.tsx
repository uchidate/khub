'use client'

const SLOT = process.env.NEXT_PUBLIC_ADSENSE_SLOT_SIDE_RAIL!

/**
 * Side rail ads — fixed on both sides of the main content, visible only on
 * wide screens (≥1600px) where there's space outside max-w-7xl (1280px).
 * Each rail is 160px wide, matching the standard "wide skyscraper" format.
 */
export function SideRailAds() {
    return (
        <>
            {/* Left rail — 160×600 wide skyscraper */}
            <div className="hidden xl:flex fixed left-2 top-1/2 -translate-y-1/2 w-[160px] h-[600px] flex-col items-center justify-center z-20 bg-amber-500/10 border-2 border-dashed border-amber-500/50 rounded">
                <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 select-none">📢 Anúncio</span>
                <span className="text-[9px] font-mono text-amber-600/70 dark:text-amber-400/70 select-none mt-1">160×600</span>
                <span className="text-[9px] font-mono text-amber-500/50 select-none">wide skyscraper</span>
                <span className="text-[8px] font-mono text-amber-500/40 select-none mt-1">slot: {SLOT}</span>
            </div>
            {/* Right rail — 160×600 wide skyscraper */}
            <div className="hidden xl:flex fixed right-2 top-1/2 -translate-y-1/2 w-[160px] h-[600px] flex-col items-center justify-center z-20 bg-amber-500/10 border-2 border-dashed border-amber-500/50 rounded">
                <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 select-none">📢 Anúncio</span>
                <span className="text-[9px] font-mono text-amber-600/70 dark:text-amber-400/70 select-none mt-1">160×600</span>
                <span className="text-[9px] font-mono text-amber-500/50 select-none">wide skyscraper</span>
                <span className="text-[8px] font-mono text-amber-500/40 select-none mt-1">slot: {SLOT}</span>
            </div>
        </>
    )
}
