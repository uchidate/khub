import { ReactNode } from "react"
import NavBar from "@/components/NavBar"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function DashboardLayout({ children }: { children: ReactNode }) {
    const session = await auth()

    if (!session) {
        redirect('/auth/login?callbackUrl=/dashboard')
    }

    return (
        <div className="min-h-screen bg-black">
            <NavBar />
            <div className="pt-20">
                <main>{children}</main>
            </div>
        </div>
    )
}
