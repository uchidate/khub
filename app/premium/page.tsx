'use client'

import { Zap, Check, Star, Crown, Info, Map, Terminal, Rocket } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { PageTransition } from '@/components/features/PageTransition'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { registerInterest } from '@/lib/actions/user'

export default function PremiumPage() {
    const [loadingTier, setLoadingTier] = useState<string | null>(null)
    const [successTier, setSuccessTier] = useState<string | null>(null)

    const tiers = [
        {
            name: 'Curioso',
            price: 'Grátis',
            description: 'Essencial para quem está começando no mundo Hallyu.',
            features: [
                'Acesso a perfis básicos',
                'Notícias em tempo real',
                'Busca limitada',
                'Sincronização em 2 aparelhos',
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
                'Sincronização ilimitada',
            ],
            icon: Zap,
            buttonText: 'REGISTRAR INTERESSE',
            highlight: true,
        },
        {
            name: 'Ultimate Fan',
            price: 'R$ 29,90',
            period: '/mês',
            description: 'A experiência definitiva com acesso total a tudo.',
            features: [
                'Tudo do plano Pro',
                'Acesso antecipado a conteúdos',
                'Newsletter VIP mensal',
                'Votos em enquetes de destaque',
                'Suporte prioritário',
                'Personalização de tema',
            ],
            icon: Crown,
            buttonText: 'QUERO SER VIP',
            highlight: false,
        },
    ]

    const roadmap = [
        { title: 'IA Hallyu', icon: Terminal, date: 'Março 2026', desc: 'Chatbot especializado em K-Pop para tirar dúvidas em tempo real.' },
        { title: 'App Mobile Native', icon: Rocket, date: 'Abril 2026', desc: 'Versão nativa para iOS e Android com notificações push.' },
        { title: 'Hub de Ingressos', icon: Map, date: 'Junho 2026', desc: 'Centralizador de pré-vendas e descontos para shows no Brasil.' },
    ]

    const handleInterest = async (tierName: string) => {
        if (tierName === 'Curioso') return
        setLoadingTier(tierName)
        try {
            await registerInterest(tierName)
            setSuccessTier(tierName)
        } catch (error) {
            console.error(error)
        } finally {
            setLoadingTier(null)
        }
    }

    return (
        <PageTransition className="pt-24 md:pt-32 pb-20 px-4 sm:px-12 md:px-20">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <SectionHeader
                        title="Evolua sua Experiência"
                        subtitle="Escolha o nível de acesso que combina com sua paixão pela cultura coreana."
                        align="center"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-32">
                    {tiers.map((tier, i) => (
                        <div
                            key={i}
                            className={`glass-card p-8 flex flex-col relative overflow-hidden transition-all duration-500 hover:-translate-y-2 ${tier.highlight ? 'border-purple-500 shadow-[0_0_40px_rgba(168,85,247,0.15)] ring-1 ring-purple-500/50' : 'border-white/5'
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
                                    <div key={j} className="flex items-start gap-4">
                                        <div className="p-0.5 rounded-full bg-purple-500/10 mt-1">
                                            <Check size={12} className="text-purple-500 shrink-0" />
                                        </div>
                                        <span className="text-zinc-300 text-sm font-medium">{feature}</span>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={() => handleInterest(tier.name)}
                                disabled={loadingTier === tier.name || successTier === tier.name}
                                className={`w-full py-4 rounded-xl font-black text-sm transition-all active:scale-95 disabled:opacity-50 disabled:scale-100 ${tier.highlight
                                    ? 'bg-purple-600 text-white hover:bg-purple-500 shadow-lg shadow-purple-600/20'
                                    : 'bg-zinc-900 text-white hover:bg-zinc-800'
                                    }`}
                            >
                                {successTier === tier.name ? 'SOLICITAÇÃO ENVIADA!' : loadingTier === tier.name ? 'PROCESSANDO...' : tier.buttonText}
                            </button>
                            {successTier === tier.name && (
                                <p className="text-[10px] text-purple-400 font-bold text-center mt-3 animate-fade-in">Avisaremos você assim que liberarmos!</p>
                            )}
                        </div>
                    ))}
                </div>

                <div className="mb-32">
                    <SectionHeader title="Roadmap de Evolução" subtitle="O que estamos construindo para você" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
                        {roadmap.map((item, i) => (
                            <div key={i} className="glass-card p-8 border-white/5 relative group">
                                <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center mb-6 group-hover:bg-purple-900/40 transition-colors">
                                    <item.icon className="text-purple-500" size={24} />
                                </div>
                                <div className="text-[10px] text-purple-400 font-black mb-2 uppercase tracking-widest">{item.date}</div>
                                <h4 className="text-white font-black text-lg mb-4 uppercase tracking-tighter leading-none">{item.title}</h4>
                                <p className="text-zinc-500 text-sm font-medium leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-20 glass-card p-10 md:p-16 text-center bg-gradient-to-r from-zinc-900/80 via-purple-900/10 to-zinc-900/80 border-purple-500/10">
                    <Info className="mx-auto text-purple-500 mb-6" size={40} />
                    <h4 className="text-2xl font-black text-white mb-4 uppercase tracking-tighter">Assinatura Versão Beta</h4>
                    <p className="text-zinc-400 mb-8 max-w-2xl mx-auto text-sm font-medium leading-relaxed">
                        No momento, o HallyuHub está em fase beta. O registro de interesse não gera cobrança imediata, mas garante que você seja um dos primeiros a testar as funcionalidades Pro com um desconto vitalício de 40%.
                    </p>
                    <div className="flex flex-wrap justify-center gap-4">
                        <Link href="/contact" className="px-10 py-4 bg-zinc-100 text-black text-xs font-black rounded-full hover:bg-white transition-all uppercase tracking-widest shadow-xl">
                            Falar com Suporte
                        </Link>
                    </div>
                </div>

                <div className="mt-16 text-center">
                    <Link href="/dashboard" className="text-zinc-600 hover:text-white transition-colors text-xs font-black uppercase tracking-[0.3em] italic">
                        ← Voltar ao Centro de Comando
                    </Link>
                </div>
            </div>
        </PageTransition>
    )
}
