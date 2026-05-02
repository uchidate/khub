import type { Metadata } from 'next'
import { JsonLd } from '@/components/seo/JsonLd'
import { ContactForm } from '@/components/features/ContactForm'
import { AdBanner } from '@/components/ui/AdBanner'
import { Mail, Instagram, HelpCircle, FileText, Handshake } from 'lucide-react'
import Link from 'next/link'

import { SITE_URL, baseOG, baseTwitter } from '@/lib/constants/site'

export const metadata: Metadata = {
    title: 'Contato',
    description: 'Entre em contato com o HallyuHub. Tire dúvidas, envie sugestões, reporte erros ou proponha parcerias. Estamos prontos para te ouvir!',
    alternates: { canonical: `${SITE_URL}/contato` },
    openGraph: {
        ...baseOG(`${SITE_URL}/contato`),
        title: 'Fale com o HallyuHub',
        description: 'Entre em contato com o HallyuHub. Tire dúvidas, envie sugestões ou reporte um problema.',
    },
    twitter: {
        ...baseTwitter(),
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
        bg: 'bg-[#fff0f5]',
        border: 'border-[#ff2d78]/20',
        iconColor: 'text-[#ff2d78]',
        description: 'Respondemos em até 48h úteis.',
    },
    {
        icon: Instagram,
        label: 'Instagram',
        value: '@hallyuhub_br',
        href: 'https://www.instagram.com/hallyuhub_br/',
        bg: 'bg-[#fdf2f8]',
        border: 'border-pink-200',
        iconColor: 'text-pink-500',
        description: 'Siga e envie uma DM para contato rápido.',
        external: true,
    },
    {
        icon: Handshake,
        label: 'Parcerias',
        value: 'parceiros@hallyuhub.com.br',
        href: 'mailto:parceiros@hallyuhub.com.br',
        bg: 'bg-[#f0fdf4]',
        border: 'border-emerald-200',
        iconColor: 'text-emerald-600',
        description: 'Propostas comerciais e colaborações.',
    },
]

const QUICK_LINKS = [
    { icon: HelpCircle, label: 'Perguntas frequentes', href: '/faq' },
    { icon: FileText, label: 'Política de privacidade', href: '/privacidade' },
]

export default function ContatoPage() {
    return (
        <>
            <JsonLd data={{
                '@context': 'https://schema.org',
                '@type': 'ContactPage',
                'url': `${SITE_URL}/contato`,
                'name': 'Contato — HallyuHub',
                'description': 'Página de contato do HallyuHub, o maior portal de cultura coreana em português.',
                'publisher': {
                    '@type': 'Organization',
                    'name': 'HallyuHub',
                    'url': SITE_URL,
                    'logo': `${SITE_URL}/og-image.jpg`,
                    'email': 'contato@hallyuhub.com.br',
                    'sameAs': ['https://www.instagram.com/hallyuhub_br/'],
                    'contactPoint': {
                        '@type': 'ContactPoint',
                        'email': 'contato@hallyuhub.com.br',
                        'contactType': 'customer support',
                        'availableLanguage': ['Portuguese'],
                        'areaServed': 'BR',
                    },
                },
            }} />

            <div className="pt-16 md:pt-24 pb-20 px-4 sm:px-6 md:px-8 min-h-screen bg-background">
                <div className="max-w-3xl mx-auto">

                    {/* Header */}
                    <div className="mb-10">
                        <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#ff2d78] bg-[#ff2d78]/8 border border-[#ff2d78]/20 px-4 py-1.5 rounded-full mb-5">
                            <Mail size={10} /> Fale conosco
                        </span>
                        <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-[-0.04em] leading-tight mb-3">
                            Entre em contato
                        </h1>
                        <p className="text-muted text-base leading-relaxed max-w-xl">
                            Tem uma dúvida, sugestão ou quer propor uma parceria? Preencha o formulário abaixo ou nos contate diretamente.
                        </p>
                    </div>

                    {/* Canais diretos */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
                        {CONTACT_CHANNELS.map(ch => (
                            <a
                                key={ch.label}
                                href={ch.href}
                                target={ch.external ? '_blank' : undefined}
                                rel={ch.external ? 'noopener noreferrer' : undefined}
                                className={`group flex items-start gap-3 p-4 rounded-xl border transition-all hover:scale-[1.02] active:scale-100 ${ch.bg} ${ch.border}`}
                            >
                                <div className={`p-2 rounded-lg bg-background shrink-0 ${ch.iconColor}`}>
                                    <ch.icon size={16} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-0.5">{ch.label}</p>
                                    <p className={`text-sm font-bold group-hover:underline underline-offset-4 break-all ${ch.iconColor}`}>{ch.value}</p>
                                    <p className="text-xs text-muted mt-1 leading-snug">{ch.description}</p>
                                </div>
                            </a>
                        ))}
                    </div>

                    {/* Formulário */}
                    <div className="bg-background border border-border rounded-2xl p-6 md:p-8 mb-8">
                        <h2 className="text-base font-bold text-foreground mb-6">Enviar mensagem</h2>
                        <ContactForm />
                    </div>

                    {/* Ad */}
                    <AdBanner
                        slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_CONTACT ?? ''}
                        variant="auto"
                        className="mb-8"
                    />

                    {/* Links rápidos */}
                    <div className="flex flex-wrap gap-2">
                        {QUICK_LINKS.map(l => (
                            <Link
                                key={l.href}
                                href={l.href}
                                className="flex items-center gap-2 px-4 py-2 rounded-full bg-surface border border-border text-sm text-muted hover:text-[#ff2d78] hover:border-[#ff2d78]/30 transition-colors"
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
