import Link from 'next/link'
import { ArrowRight, Heart, ShoppingBag } from 'lucide-react'

export function LojaBanner() {
    return (
        <div className="relative overflow-hidden rounded-3xl border border-border bg-surface p-4 shadow-sm">
            <div className="relative flex items-center gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-accent text-white">
                    <ShoppingBag className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 text-sm font-black text-foreground">
                        Apoie o HallyuHub comprando pela vitrine
                        <Heart className="hidden h-3.5 w-3.5 fill-accent text-accent sm:block" />
                    </p>
                    <p className="mt-0.5 text-xs leading-5 text-muted">
                        Mesmo produto, mesmo preço. A comissão ajuda a manter o site.
                    </p>
                </div>
                <Link
                    href="/loja"
                    className="hidden shrink-0 items-center gap-1.5 rounded-full border border-border bg-background px-3 py-2 text-xs font-black text-foreground transition-colors hover:border-accent/40 hover:text-accent sm:inline-flex"
                >
                    Ver loja
                    <ArrowRight className="h-3.5 w-3.5" />
                </Link>
            </div>
        </div>
    )
}
