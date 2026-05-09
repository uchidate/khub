import { Heart } from 'lucide-react'

export function LojaBanner() {
    return (
        <div className="relative overflow-hidden rounded-2xl bg-orange-500/8 border border-orange-500/20 p-5">
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-orange-500/5 rounded-full" />

            <div className="relative flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5 w-7 h-7 rounded-full bg-orange-500/10 flex items-center justify-center">
                    <Heart className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
                </div>
                <div>
                    <p className="text-sm font-bold text-foreground">
                        Apoie o HallyuHub comprando pelo nosso link
                    </p>
                    <p className="text-xs text-muted mt-0.5">Mesmo produto, mesmo preço — a gente recebe uma comissão da loja.</p>
                </div>
            </div>
        </div>
    )
}
