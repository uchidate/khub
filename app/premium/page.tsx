import { Zap, Check, Star, Crown } from 'lucide-react'
import Link from 'next/link'
import { PageTransition } from '@/components/features/PageTransition'
import { SectionHeader } from '@/components/ui/SectionHeader'

export default function PremiumPage() {
    const tiers = [
        {
            name: 'Curioso',
            price: 'Grátis',
            description: 'Essencial para quem está começando no mundo Hallyu.',
            features: [
                'Acesso a perfis básicos',
                'Notícias em tempo real',
                'Busca limitada',
            ],
            icon: Star,
            buttonText: 'CONTINUAR GRÁTIS',
            highlight: false,
        },
        {
            name: 'Hallyu Pro',
            price: 'R$ 14,90',
            period: '/mês',
            description: 'Para os verdadeiros fãs que querem profundidade e exclusividade.',
            features: [
                'Tudo do plano Curioso',
                'Perfis detalhados e técnicos',
                'Estatísticas de tendências',
                'Sem anúncios (em breve)',
                'Badges exclusivas no perfil',
            ],
            icon: Zap,
            buttonText: 'TORNE-SE PRO',
            highlight: true,
        },
        {
            name: 'Ultimate Fan',
            price: 'R$ 29,90',
            period: '/mês',
            description: 'A experiência definitiva. Acesso total a tudo que o HallyuHub oferece.',
            features: [
                'Tudo do plano Pro',
                'Acesso antecipado a conteúdos',
                'Newsletter VIP mensal',
                'Votos em enquetes de destaque',
                'Suporte prioritário',
            ],
            icon: Crown,
            buttonText: 'VIVA O ULTIMATE',
            highlight: false,
        },
    ]

    return (
        <PageTransition className="pt-24 md:pt-32 pb-20 px-4 sm:px-12 md:px-20">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <SectionHeader
                        title="Escolha seu Nível"
                        subtitle="Eleve sua paixão pela cultura coreana para o próximo patamar com nossos planos exclusivos."
                        align="center"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {tiers.map((tier, i) => (
                        <div
                            key={i}
                            className={`glass-card p-8 flex flex-col relative overflow-hidden ${tier.highlight ? 'border-purple-500 shadow-[0_0_40px_rgba(168,85,247,0.15)] ring-1 ring-purple-500/50' : ''
                                }`}
                        >
                            {tier.highlight && (
                                <div className="absolute top-0 right-0 bg-purple-500 text-white text-[10px] font-black px-4 py-1 rounded-bl-xl tracking-widest uppercase">
                                    MAIS POPULAR
                                </div>
                            )}

                            <div className="mb-8">
                                <tier.icon className={`mb-4 ${tier.highlight ? 'text-purple-500' : 'text-zinc-500'}`} size={40} />
                                <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-tighter">{tier.name}</h3>
                                <div className="flex items-baseline gap-1 mb-4">
                                    <span className="text-4xl font-black text-white">{tier.price}</span>
                                    {tier.period && <span className="text-zinc-500 text-sm font-medium">{tier.period}</span>}
                                </div>
                                <p className="text-zinc-400 text-sm leading-relaxed">{tier.description}</p>
                            </div>

                            <div className="space-y-4 mb-10 flex-grow">
                                {tier.features.map((feature, j) => (
                                    <div key={j} className="flex items-start gap-3">
                                        <Check size={16} className="text-purple-500 mt-0.5 shrink-0" />
                                        <span className="text-zinc-300 text-sm">{feature}</span>
                                    </div>
                                ))}
                            </div>

                            <button
                                className={`w-full py-4 rounded-xl font-black text-sm transition-all active:scale-95 ${tier.highlight
                                    ? 'bg-purple-600 text-white hover:bg-purple-500 shadow-lg shadow-purple-600/20'
                                    : 'bg-zinc-900 text-white hover:bg-zinc-800'
                                    }`}
                            >
                                {tier.buttonText}
                            </button>
                        </div>
                    ))}
                </div>

                <div className="mt-20 glass-card p-8 md:p-12 text-center bg-gradient-to-r from-zinc-900/50 via-purple-900/10 to-zinc-900/50">
                    <h4 className="text-xl font-bold text-white mb-4">Tem alguma dúvida sobre os planos?</h4>
                    <p className="text-zinc-400 mb-8 max-w-2xl mx-auto text-sm">
                        Nossa equipe está pronta para ajudar você a escolher a melhor experiência.
                        Fale conosco através das nossas redes sociais ou canal de suporte.
                    </p>
                    <div className="flex flex-wrap justify-center gap-4">
                        <Link href="/contact" className="px-8 py-3 bg-zinc-800 text-white text-xs font-bold rounded-full hover:bg-zinc-700 transition-colors">
                            CONTATE-NOS
                        </Link>
                    </div>
                </div>

                <div className="mt-12 text-center">
                    <Link href="/dashboard" className="text-zinc-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest">
                        ← Voltar ao Dashboard
                    </Link>
                </div>
            </div>
        </PageTransition>
    )
}
