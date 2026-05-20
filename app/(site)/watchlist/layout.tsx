import type { Metadata } from 'next'
import { AccountNav } from '@/components/account/AccountNav'

export const metadata: Metadata = {
    robots: { index: false, follow: false },
}

export default function WatchlistLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <div className="mx-auto max-w-7xl px-4 pt-3 sm:px-6 lg:px-8">
                <AccountNav />
            </div>
            {children}
        </>
    )
}
