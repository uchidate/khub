'use client'

import {
  Zap, Check, Star, Crown, Info, Terminal, Rocket,
  X, ChevronDown, ChevronUp, Bell, Heart, Newspaper,
  Sparkles, Users, TrendingUp, Shield, Palette, MessageCircle,
} from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { PageTransition } from '@/components/features/PageTransition'
import { registerInterest } from '@/lib/actions/user'

// ─── Dados ────────────────────────────────────────────────────────────────────

const TIERS = [
  {
    name: 'Curioso',
    price: { monthly: 0, annual: 0 },
    description: 'Para quem está começando no universo Hallyu.',
    icon: Star,
    color: 'zinc',
    cta: 'Continuar Grátis',
    highlight: false,
  },
  {
    name: 'Hallyu Pro',
    price: { monthly: 14.90, annual: 9.90 },
    description: 'Para fãs que querem profundidade, personalização e exclusividade.',
    icon: Zap,
    color: 'purple',
    cta: 'Registrar Interesse',
    highlight: true,
    badge: 'Mais Popular',
  },
  {
    name: 'Ultimate Fan',
    price: { monthly: 29.90, annual: 19.90 },
    description: 'A experiência definitiva com acesso total e voz ativa na plataforma.',
    icon: Crown,
    color: 'yellow',
    cta: 'Quero ser VIP',
    highlight: false,
  },
]

type FeatureRow = {
  label: string
  icon: React.ElementType
  free: boolean | string
  pro: boolean | string
  ultimate: boolean | string
  highlight?: boolean
}

const FEATURES: FeatureRow[] = [
  { label: 'Perfis de artistas e grupos',        icon: Users,          free: true,          pro: true,               ultimate: true },
  { label: 'Notícias em tempo real',              icon: Newspaper,      free: true,          pro: true,               ultimate: true },
  { label: 'Favoritos ilimitados',                icon: Heart,          free: true,          pro: true,               ultimate: true },
  { label: 'Dashboard pessoal',                   icon: TrendingUp,     free: true,          pro: true,               ultimate: true },
  { label: 'Comentários em notícias',             icon: MessageCircle,  free: true,          pro: true,               ultimate: true },
  { label: 'Notícias personalizadas (Para você)', icon: Sparkles,       free: false,         pro: true,               ultimate: true,  highlight: true },
  { label: 'Alertas por email (artistas)',        icon: Bell,           free: false,         pro: true,               ultimate: true,  highlight: true },
  { label: 'Sem anúncios',                        icon: Shield,         free: false,         pro: true,               ultimate: true },
  { label: 'Badge Pro no perfil',                 icon: Zap,            free: false,         pro: true,               ultimate: true },
  { label: 'Acesso antecipado a conteúdos',       icon: Rocket,         free: false,         pro: false,              ultimate: true,  highlight: true },
  { label: 'Newsletter VIP mensal',               icon: Newspaper,      free: false,         pro: false,              ultimate: true },
  { label: 'Voto em enquetes de destaque',        icon: Users,          free: false,         pro: false,              ultimate: true },
  { label: 'Personalização de tema',              icon: Palette,        free: false,         pro: false,              ultimate: true },
  { label: 'Suporte prioritário',                 icon: Shield,         free: false,         pro: false,              ultimate: true },
]

const FAQS = [
  {
    q: 'O registro de interesse gera cobrança?',
    a: 'Não. O HallyuHub está em fase beta. Ao registrar interesse você apenas garante seu lugar na lista e um desconto vitalício de 40% quando a assinatura for lançada.',
  },
  {
    q: 'Posso cancelar quando quiser?',
    a: 'Sim. Quando a assinatura for ativada, você poderá cancelar a qualquer momento sem multas ou taxas.',
  },
  {
    q: 'O plano anual tem fidelidade?',
    a: 'O desconto anual é de ~34% comparado ao mensal. O cancelamento libera acesso até o fim do período pago.',
  },
  {
    q: 'As notícias personalizadas funcionam como?',
    a: 'O sistema detecta seus artistas favoritos e filtra automaticamente as notícias para mostrar primeiro o conteúdo relevante para você, com badge "Para você" no dashboard.',
  },
  {
    q: 'O que é o desconto vitalício de 40%?',
    a: 'Quem registrar interesse antes do lançamento oficial receberá o preço congelado com 40% de desconto para sempre — mesmo que o preço suba no futuro.',
  },
]

const ROADMAP = [
  { title: 'IA Hallyu',           icon: Terminal, date: 'Mar 2026', desc: 'Chatbot especializado em K-Pop para tirar dúvidas e descobrir conteúdo em tempo real.' },
  { title: 'App Mobile Nativo',   icon: Rocket,   date: 'Abr 2026', desc: 'Versão nativa para iOS e Android com notificações push personalizadas.' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function CellIcon({ value }: { value: boolean | string }) {
  if (value === false) return <X size={16} className="text-zinc-700 mx-auto" />
  if (value === true)  return <Check size={16} className="text-purple-400 mx-auto" />
  return <span className="text-xs text-zinc-300 font-bold">{value}</span>
}

function fmt(price: number) {
  return price === 0 ? 'Grátis' : `R$ ${price.toFixed(2).replace('.', ',')}`
}

// ─── Componente principal ──────────────────────────────────────────────────────

export default function PremiumPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [annual, setAnnual]           = useState(false)
  const [loadingTier, setLoadingTier] = useState<string | null>(null)
  const [successTier, setSuccessTier] = useState<string | null>(null)
  const [openFaq, setOpenFaq]         = useState<number | null>(null)
  const [errorMsg, setErrorMsg]       = useState<string | null>(null)

  const handleInterest = async (tierName: string) => {
    if (tierName === 'Curioso') return

    // Redirecionar para login se não autenticado
    if (!session?.user) {
      router.push(`/auth/login?callbackUrl=/premium`)
      return
    }

    setLoadingTier(tierName)
    setErrorMsg(null)
    try {
      await registerInterest(tierName)
      setSuccessTier(tierName)
    } catch (e: any) {
      setErrorMsg('Erro ao registrar interesse. Tente novamente.')
      console.error(e)
    } finally {
      setLoadingTier(null)
    }
  }

  return (
    <PageTransition className="pt-24 md:pt-32 pb-20 px-4 sm:px-8 md:px-16">
      <div className="max-w-6xl mx-auto">

        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-purple-400 bg-purple-500/10 border border-purple-500/20 px-4 py-1.5 rounded-full mb-6">
            <Sparkles size={10} /> Beta — Desconto vitalício de 40% para early adopters
          </span>
          <h1 className="text-5xl md:text-7xl font-display font-black text-white uppercase italic tracking-tight leading-none mb-4">
            Evolua sua<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyber-purple via-neon-pink to-electric-cyan animate-gradient">
              Experiência Hallyu
            </span>
          </h1>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto leading-relaxed mb-8">
            Acesso a perfis completos, notícias personalizadas dos seus artistas favoritos e muito mais.
          </p>

          {/* Stats de prova social */}
          <div className="flex justify-center gap-8 text-center mb-12">
            {[
              { value: '5.000+', label: 'Artistas' },
              { value: '2.000+', label: 'Produções' },
              { value: '10.000+', label: 'Notícias' },
            ].map(s => (
              <div key={s.label}>
                <p className="text-2xl font-black text-white">{s.value}</p>
                <p className="text-xs text-zinc-500 uppercase tracking-widest">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Toggle mensal / anual ────────────────────────────────────────── */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex items-center gap-4 bg-zinc-900 border border-white/10 rounded-full p-1.5">
            <button
              onClick={() => setAnnual(false)}
              className={`px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all ${!annual ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'}`}
            >
              Mensal
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${annual ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'}`}
            >
              Anual
              <span className="text-[9px] bg-green-500 text-white px-1.5 py-0.5 rounded-full font-black">-34%</span>
            </button>
          </div>
        </div>

        {/* ── Cards de preços ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          {TIERS.map((tier) => {
            const price = annual ? tier.price.annual : tier.price.monthly
            const isPro = tier.highlight
            const isSuccess = successTier === tier.name
            const isLoading = loadingTier === tier.name

            return (
              <div
                key={tier.name}
                className={`glass-card p-8 flex flex-col relative overflow-hidden transition-all duration-500 hover:-translate-y-2 ${
                  isPro
                    ? 'border-purple-500/60 shadow-[0_0_50px_rgba(168,85,247,0.2)] ring-1 ring-purple-500/40'
                    : 'border-white/5'
                }`}
              >
                {isPro && (
                  <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent" />
                )}
                {tier.badge && (
                  <div className="absolute top-4 right-4 bg-purple-500 text-white text-[9px] font-black px-3 py-1 rounded-full tracking-widest uppercase">
                    {tier.badge}
                  </div>
                )}

                {/* Ícone + Nome */}
                <div className="mb-6">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${
                    isPro ? 'bg-purple-500/20' : 'bg-zinc-800'
                  }`}>
                    <tier.icon size={22} className={isPro ? 'text-purple-400' : tier.color === 'yellow' ? 'text-yellow-400' : 'text-zinc-400'} />
                  </div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-1">{tier.name}</h3>
                  <p className="text-zinc-500 text-xs leading-relaxed">{tier.description}</p>
                </div>

                {/* Preço */}
                <div className="mb-8">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-white">{fmt(price)}</span>
                    {price > 0 && <span className="text-zinc-500 text-sm">/mês</span>}
                  </div>
                  {annual && price > 0 && (
                    <p className="text-xs text-green-400 font-bold mt-1">
                      Cobrado anualmente · Economize R$ {((tier.price.monthly - price) * 12).toFixed(0).replace('.', ',')}
                    </p>
                  )}
                  {!annual && price > 0 && (
                    <p className="text-xs text-zinc-600 mt-1">
                      ou R$ {tier.price.annual.toFixed(2).replace('.', ',')}/mês no plano anual
                    </p>
                  )}
                </div>

                {/* Features do plano */}
                <div className="space-y-3 mb-8 flex-grow">
                  {FEATURES
                    .filter(f => {
                      if (tier.name === 'Curioso')      return f.free !== false
                      if (tier.name === 'Hallyu Pro')   return f.pro !== false && f.free === false
                      return f.ultimate !== false && f.pro === false && f.free === false
                    })
                    .slice(0, tier.name === 'Curioso' ? 5 : 6)
                    .map((f, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className={`p-0.5 rounded-full mt-0.5 ${isPro ? 'bg-purple-500/10' : 'bg-zinc-800'}`}>
                          <Check size={11} className={isPro ? 'text-purple-400' : 'text-zinc-500'} />
                        </div>
                        <span className={`text-xs font-medium ${f.highlight ? 'text-white' : 'text-zinc-400'}`}>
                          {f.label}
                          {f.highlight && <span className="ml-1.5 text-[9px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded font-black uppercase">novo</span>}
                        </span>
                      </div>
                    ))}
                  {tier.name !== 'Curioso' && (
                    <p className="text-[10px] text-zinc-600 pl-5">+ tudo do plano anterior</p>
                  )}
                </div>

                {/* CTA */}
                <button
                  onClick={() => handleInterest(tier.name)}
                  disabled={isLoading || isSuccess || tier.name === 'Curioso'}
                  className={`w-full py-4 rounded-xl font-black text-sm transition-all active:scale-95 disabled:cursor-default uppercase tracking-wider ${
                    isPro
                      ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white hover:from-purple-500 hover:to-purple-400 shadow-lg shadow-purple-600/30 disabled:opacity-60'
                      : tier.name === 'Curioso'
                        ? 'bg-zinc-800 text-zinc-400 cursor-default'
                        : 'bg-zinc-900 border border-white/10 text-white hover:bg-zinc-800'
                  }`}
                >
                  {isSuccess
                    ? '✓ Interesse registrado!'
                    : isLoading
                      ? 'Processando...'
                      : !session?.user && tier.name !== 'Curioso'
                        ? 'Entrar e registrar interesse'
                        : tier.cta}
                </button>
                {isSuccess && (
                  <p className="text-[10px] text-purple-400 font-bold text-center mt-2">
                    Você receberá 40% de desconto no lançamento!
                  </p>
                )}
                {errorMsg && loadingTier !== tier.name && (
                  <p className="text-[10px] text-red-400 text-center mt-2">{errorMsg}</p>
                )}
              </div>
            )
          })}
        </div>

        {/* ── Tabela comparativa ───────────────────────────────────────────── */}
        <div className="mb-20">
          <h2 className="text-2xl font-display font-black text-white uppercase italic tracking-tight text-center mb-8">
            Comparativo completo
          </h2>
          <div className="glass-card overflow-hidden border-white/5">
            {/* Header */}
            <div className="grid grid-cols-4 border-b border-white/5 bg-zinc-900/50">
              <div className="p-4 text-xs font-black uppercase text-zinc-500 tracking-widest">Recurso</div>
              {['Curioso', 'Hallyu Pro', 'Ultimate Fan'].map((name, i) => (
                <div key={name} className={`p-4 text-center text-xs font-black uppercase tracking-widest ${i === 1 ? 'text-purple-400' : 'text-zinc-400'}`}>
                  {name}
                </div>
              ))}
            </div>
            {/* Rows */}
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className={`grid grid-cols-4 border-b border-white/5 last:border-0 transition-colors ${
                  f.highlight ? 'bg-purple-500/5' : i % 2 === 0 ? 'bg-white/[0.01]' : ''
                }`}
              >
                <div className="p-3 flex items-center gap-2">
                  <f.icon size={13} className="text-zinc-600 shrink-0" />
                  <span className={`text-xs ${f.highlight ? 'text-white font-bold' : 'text-zinc-400'}`}>{f.label}</span>
                </div>
                <div className="p-3 flex items-center justify-center"><CellIcon value={f.free} /></div>
                <div className="p-3 flex items-center justify-center"><CellIcon value={f.pro} /></div>
                <div className="p-3 flex items-center justify-center"><CellIcon value={f.ultimate} /></div>
              </div>
            ))}
          </div>
        </div>

        {/* ── O que você está perdendo ────────────────────────────────────── */}
        <div className="mb-20">
          <h2 className="text-2xl font-display font-black text-white uppercase italic tracking-tight text-center mb-3">
            Funcionalidades exclusivas Pro
          </h2>
          <p className="text-zinc-500 text-sm text-center mb-10">Recursos que já existem na plataforma, liberados para assinantes</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Sparkles,
                title: 'Notícias Para Você',
                desc: 'O dashboard filtra automaticamente as notícias mostrando apenas conteúdo dos seus artistas favoritos, com badge personalizado.',
                color: 'from-purple-600/20 to-transparent',
                border: 'border-purple-500/20',
              },
              {
                icon: Bell,
                title: 'Alertas de Artistas',
                desc: 'Receba um email sempre que sair uma notícia sobre algum artista que você favorita. Nunca perca um comeback ou lançamento.',
                color: 'from-pink-600/20 to-transparent',
                border: 'border-pink-500/20',
              },
              {
                icon: Shield,
                title: 'Sem Anúncios',
                desc: 'Navegue por perfis, notícias e produções sem nenhuma interrupção publicitária. Experiência limpa e focada.',
                color: 'from-cyan-600/20 to-transparent',
                border: 'border-cyan-500/20',
              },
            ].map((item) => (
              <div key={item.title} className={`glass-card p-8 bg-gradient-to-br ${item.color} border ${item.border} relative overflow-hidden group hover:-translate-y-1 transition-transform`}>
                <item.icon size={28} className="text-white mb-4 opacity-80" />
                <h4 className="text-white font-black text-lg uppercase tracking-tighter mb-3 leading-none">{item.title}</h4>
                <p className="text-zinc-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Roadmap ──────────────────────────────────────────────────────── */}
        <div className="mb-20">
          <h2 className="text-2xl font-display font-black text-white uppercase italic tracking-tight text-center mb-10">
            O que estamos construindo
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {ROADMAP.map((item) => (
              <div key={item.title} className="glass-card p-8 border-white/5 relative group hover:-translate-y-1 transition-transform">
                <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center mb-5 group-hover:bg-purple-900/40 transition-colors">
                  <item.icon className="text-purple-500" size={22} />
                </div>
                <div className="text-[10px] text-purple-400 font-black mb-2 uppercase tracking-widest">{item.date}</div>
                <h4 className="text-white font-black text-lg mb-3 uppercase tracking-tighter leading-none">{item.title}</h4>
                <p className="text-zinc-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── FAQ ──────────────────────────────────────────────────────────── */}
        <div className="mb-20">
          <h2 className="text-2xl font-display font-black text-white uppercase italic tracking-tight text-center mb-10">
            Perguntas frequentes
          </h2>
          <div className="space-y-2 max-w-3xl mx-auto">
            {FAQS.map((faq, i) => (
              <div key={i} className="glass-card border-white/5 overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-white/5 transition-colors"
                >
                  <span className="text-sm font-bold text-white pr-4">{faq.q}</span>
                  {openFaq === i
                    ? <ChevronUp size={16} className="text-zinc-500 shrink-0" />
                    : <ChevronDown size={16} className="text-zinc-500 shrink-0" />
                  }
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5">
                    <p className="text-zinc-400 text-sm leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Banner beta ──────────────────────────────────────────────────── */}
        <div className="glass-card p-10 md:p-14 text-center bg-gradient-to-r from-zinc-900/80 via-purple-900/10 to-zinc-900/80 border-purple-500/20 relative overflow-hidden mb-12">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(168,85,247,0.08),transparent_70%)]" />
          <div className="relative z-10">
            <Info className="mx-auto text-purple-400 mb-4" size={32} />
            <h4 className="text-2xl font-black text-white mb-3 uppercase tracking-tighter">Versão Beta — Trave seu desconto agora</h4>
            <p className="text-zinc-400 mb-8 max-w-xl mx-auto text-sm leading-relaxed">
              O HallyuHub está em fase beta. O registro de interesse <strong className="text-white">não gera cobrança imediata</strong>, mas garante que você seja um dos primeiros a testar com um desconto vitalício de <strong className="text-purple-400">40%</strong> quando a assinatura for lançada.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <button
                onClick={() => handleInterest('Hallyu Pro')}
                disabled={!!loadingTier || !!successTier}
                className="px-10 py-4 bg-gradient-to-r from-purple-600 to-purple-500 text-white text-xs font-black rounded-full hover:from-purple-500 hover:to-purple-400 transition-all uppercase tracking-widest shadow-lg shadow-purple-600/30 disabled:opacity-50"
              >
                {successTier
                  ? '✓ Interesse registrado!'
                  : !session?.user
                    ? 'Entrar e garantir 40% de desconto'
                    : 'Garantir desconto de 40%'}
              </button>
              <Link href="/contact" className="px-10 py-4 bg-zinc-800 text-white text-xs font-black rounded-full hover:bg-zinc-700 transition-all uppercase tracking-widest">
                Falar com Suporte
              </Link>
            </div>
          </div>
        </div>

        {/* ── Back link ────────────────────────────────────────────────────── */}
        <div className="text-center">
          <Link href="/dashboard" className="text-zinc-600 hover:text-white transition-colors text-xs font-black uppercase tracking-[0.3em] italic">
            ← Voltar ao Command Center
          </Link>
        </div>

      </div>
    </PageTransition>
  )
}
