import { Heart } from 'lucide-react'

export function LojaBanner() {
    return (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 via-orange-400 to-yellow-400 p-6 text-white">
            <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full" />
            <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-white/10 rounded-full" />

            <div className="relative">
                <div className="flex items-center gap-2 mb-1">
                    <Heart className="w-4 h-4 fill-white" />
                    <span className="text-xs font-bold uppercase tracking-widest opacity-90">Apoie o HallyuHub</span>
                </div>
                <p className="text-lg font-black leading-tight">
                    Compre com nosso link e ganhe o mesmo produto — a gente ganha uma comissão
                </p>
                <p className="text-sm opacity-80 mt-1">Sem custo extra pra você. É a melhor forma de apoiar o site.</p>
            </div>
        </div>
    )
}
