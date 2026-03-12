import type { Metadata } from 'next'
import { JsonLd } from '@/components/seo/JsonLd'
import { ContactForm } from '@/components/features/ContactForm'
import { AdBanner } from '@/components/ui/AdBanner'
import { Mail, Instagram, HelpCircle, FileText } from 'lucide-react'
import Link from 'next/link'

const BASE_URL = 'https://www.hallyuhub.com.br'

export const metadata: Metadata = {
    title: 'Contato | HallyuHub',
    description: 'Entre em contato com o HallyuHub. Tire dúvidas, envie sugestões, reporte erros ou proponha parcerias. Estamos prontos para te ouvir!',
    alternates: {
        canonical: `${BASE_URL}/contato`,
    },
    openGraph: {
        title: 'Fale com o HallyuHub',
        description: 'Entre em contato com o HallyuHub. Tire dúvidas, envie sugestões ou reporte um problema.',
        url: `${BASE_URL}/contato`,
        type: 'website',
    },
    twitter: {
        card: 'summary',
        title: 'Fale com o HallyuHub',
        description: 'Entre em contato com o HallyuHub. Tire dúvidas, envie sugestões ou reporte um problema.',
    },
}

const CONTACT_CHANNELS = [
    {
        icon: Mail,
        label: 'E-mail',
        value: 'contato@hallyuhub.com.br',
        href: 'mailto:contato@hallyuhub.com.br',
        color: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
        description: 'Respondemos em até 48h úteis.',
    },
    {
        icon: Instagram,
        label: 'Instagram',
        value: '@hallyuhub_br',
        href: 'https://www.instagram.com/hallyuhub_br/',
        color: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
        description: 'Siga e envie uma DM para contato rápido.',
        external: true,
    },
]

const QUICK_LINKS = [
    { icon: HelpCircle, label: 'Perguntas frequentes',  href: '/faq' },
    { icon: FileText,   label: 'Política de privacidade', href: '/privacidade' },
]

export default function ContatoPage() {
    return (
        <>
            <JsonLd data={{
                '@context': 'https://schema.org',
                '@type': 'ContactPage',
                'url': `${BASE_URL}/contato`,
                'name': 'Contato — HallyuHub',
                'description': 'Página de contato do HallyuHub, o maior portal de cultura coreana em português.',
                'publisher': {
                    '@type': 'Organization',
                    'name': 'HallyuHub',
                    'url': BASE_URL,
                    'logo': `${BASE_URL}/og-image.jpg`,
                    'email': 'contato@hallyuhub.com.br',
                    'sameAs': [
                        'https://www.instagram.com/hallyuhub_br/',
                    ],
                    'contactPoint': {
                        '@type': 'ContactPoint',
                        'email': 'contato@hallyuhub.com.br',
                        'contactType': 'customer support',
                        'availableLanguage': ['Portuguese'],
                        'areaServed': 'BR',
                    },
                },
            }} />

            <div className="pt-24 md:pt-32 pb-20 px-4 sm:px-8 md:px-12 min-h-screen">
                <div className="max-w-3xl mx-auto">

                    {/* Header */}
                    <div className="mb-12">
                        <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-purple-400 bg-purple-500/10 border border-purple-500/20 px-4 py-1.5 rounded-full mb-6">
                            <Mail size={10} /> Fale conosco
                        </span>
                        <h1 className="text-4xl md:text-6xl font-black text-white uppercase italic tracking-tight leading-none mb-4">
                            Entre em<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                                contato
                            </span>
                        </h1>
                        <p className="text-zinc-400 text-lg max-w-xl leading-relaxed">
                            Tem uma dúvida, sugestão ou quer propor uma parceria? Preencha o formulário abaixo ou nos contate diretamente.
                        </p>
                    </div>

                    {/* Canais diretos */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
                        {CONTACT_CHANNELS.map(ch => (
                            <a
                                key={ch.label}
                                href={ch.href}
                                target={ch.external ? '_blank' : undefined}
                                rel={ch.external ? 'noopener noreferrer' : undefined}
                                className={`group flex items-start gap-4 p-5 rounded-2xl border transition-all hover:scale-[1.02] active:scale-100 ${ch.color}`}
                            >
                                <div className={`p-2 rounded-xl border ${ch.color} shrink-0`}>
                                    <ch.icon size={18} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-0.5">{ch.label}</p>
                                    <p className="font-bold text-white group-hover:underline underline-offset-4">{ch.value}</p>
                                    <p className="text-xs text-zinc-500 mt-1">{ch.description}</p>
                                </div>
                            </a>
                        ))}
                    </div>

                    {/* Formulário */}
                    <div className="bg-zinc-900/50 border border-white/8 rounded-3xl p-6 md:p-8 mb-10">
                        <h2 className="text-lg font-bold text-white mb-6">Enviar mensagem</h2>
                        <ContactForm />
                    </div>

                    {/* Ad */}
                    <AdBanner
                        slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_CONTACT ?? ''}
                        format="horizontal"
                        className="mb-10"
                    />

                    {/* Links rápidos */}
                    <div className="flex flex-wrap gap-3">
                        {QUICK_LINKS.map(l => (
                            <Link
                                key={l.href}
                                href={l.href}
                                className="flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900 border border-white/8 text-sm text-zinc-400 hover:text-white hover:border-white/20 transition-colors"
                            >
                                <l.icon size={13} />
                                {l.label}
                            </Link>
                        ))}
                    </div>

                </div>
            </div>
        </>
    )
}
