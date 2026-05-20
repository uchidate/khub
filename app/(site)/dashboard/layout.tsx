import type { Metadata } from 'next'
import { ReactNode } from "react"
import { AccountNav } from '@/components/account/AccountNav'

export const metadata: Metadata = {
    robots: { index: false, follow: false },
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
    return (
        <>
            <div className="mx-auto max-w-7xl px-4 pt-3 sm:px-6 lg:px-8">
                <AccountNav />
            </div>
            {children}
        </>
    )
}
