'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, HelpCircle, User, Star, Newspaper, Shield, Zap } from 'lucide-react'
import { PageTransition } from '@/components/features/PageTransition'

const SECTIONS = [
  {
    icon: HelpCircle,
    label: 'Plataforma',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    items: [
      {
        q: 'O que é o HallyuHub?',
        a: 'O HallyuHub é o maior portal de cultura coreana em português. Reunimos perfis detalhados de artistas K-Pop, grupos, dramas, filmes e notícias traduzidas, tudo em um só lugar para fãs brasileiros e lusófonos.',
      },
      {
        q: 'O site é gratuito?',
        a: 'Sim! O acesso básico ao HallyuHub é completamente gratuito. Você pode explorar perfis de artistas, assistir notícias traduzidas e descobrir produções sem criar conta. Estamos desenvolvendo planos premium com funcionalidades exclusivas — mas o núcleo da plataforma sempre será acessível a todos.',
      },
      {
        q: 'Em quais idiomas o site está disponível?',
        a: 'O HallyuHub é inteiramente em português do Brasil. As notícias chegam originalmente em inglês ou coreano e são traduzidas automaticamente para PT-BR antes de serem publicadas.',
      },
      {
        q: 'O HallyuHub tem aplicativo?',
        a: 'Ainda não temos um app nativo, mas o site é totalmente responsivo e funciona muito bem em celulares. Você também pode adicioná-lo à tela inicial do seu smartphone — ele funciona como um PWA (Progressive Web App). Um app nativo para iOS e Android está no nosso roadmap.',
      },
    ],
  },
  {
    icon: User,
    label: 'Conta e Perfil',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    items: [
      {
        q: 'Preciso criar uma conta?',
        a: 'Não é obrigatório. Mas ao criar uma conta você pode favoritar artistas, produções e notícias, receber o feed personalizado de notícias dos seus artistas favoritos e comentar nas notícias.',
      },
      {
        q: 'Como crio minha conta?',
        a: 'Acesse /auth/login e escolha entre cadastro com e-mail e senha ou login com Google. O processo leva menos de um minuto.',
      },
      {
        q: 'Posso excluir minha conta?',
        a: 'Sim. Acesse seu painel, vá em Configurações e clique em "Excluir conta". Todos os seus dados serão permanentemente removidos em até 30 dias. Esta ação é irreversível.',
      },
      {
        q: 'Esqueci minha senha. O que faço?',
        a: 'Na página de login, clique em "Esqueceu a senha?" e informe o e-mail cadastrado. Enviaremos um link de redefinição em instantes. Verifique também a pasta de spam.',
      },
    ],
  },
  {
    icon: Star,
    label: 'Favoritos e Feed',
    color: 'text-neon-pink',
    bg: 'bg-pink-500/10',
    items: [
      {
        q: 'Como funciona o sistema de favoritos?',
        a: 'Clique no ícone de coração (♥) em qualquer artista, grupo, produção ou notícia. Os itens favoritados aparecem no seu painel e alimentam o Feed Personalizado em /news/feed.',
      },
      {
        q: 'O que é o Feed Personalizado?',
        a: 'É uma página em /news/feed que exibe apenas as notícias relacionadas aos artistas e grupos que você favoritou. Quanto mais você favorita, mais preciso o feed fica.',
      },
      {
        q: 'Posso receber notificações de novos conteúdos?',
        a: 'Sim! Quando novas notícias envolvendo seus artistas favoritos são publicadas, você recebe uma notificação por e-mail (se habilitado nas configurações). Notificações push no browser chegam em breve.',
      },
    ],
  },
  {
    icon: Newspaper,
    label: 'Notícias',
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    items: [
      {
        q: 'De onde vêm as notícias?',
        a: 'Coletamos notícias de fontes especializadas em K-Pop e K-Drama como Soompi, Koreaboo, Dramabeans, Asian Junkie e outras. O conteúdo é traduzido automaticamente para português brasileiro.',
      },
      {
        q: 'As traduções são feitas por humanos?',
        a: 'As traduções são geradas por inteligência artificial e revisadas automaticamente para garantir qualidade. Trabalhamos continuamente para melhorar a precisão, especialmente para nomes de artistas, títulos de obras e expressões idiomáticas do K-Pop.',
      },
      {
        q: 'Encontrei um erro numa notícia. Como reporto?',
        a: 'Na página da notícia, use o botão de flag (⚑) para reportar um problema. Descreva brevemente o que está errado e nossa equipe revisará em breve.',
      },
      {
        q: 'Posso assinar um RSS feed das notícias?',
        a: 'Sim! Acesse /news/rss para obter o feed RSS com as notícias mais recentes. Você pode adicionar esse endereço em qualquer leitor de RSS.',
      },
    ],
  },
  {
    icon: Shield,
    label: 'Segurança e Privacidade',
    color: 'text-green-400',
    bg: 'bg-green-500/10',
    items: [
      {
        q: 'Como meus dados são protegidos?',
        a: 'Seus dados são armazenados em servidores seguros com criptografia em trânsito (HTTPS/TLS). Não compartilhamos informações pessoais com terceiros para fins publicitários. Leia nossa Política de Privacidade completa em /privacidade.',
      },
      {
        q: 'O HallyuHub usa cookies?',
        a: 'Usamos cookies essenciais para autenticação e funcionamento do site (como manter sua sessão ativa). Também usamos cookies analíticos anonimizados via Google Analytics para entender como a plataforma é usada e melhorá-la.',
      },
      {
        q: 'Vocês vendem meus dados?',
        a: 'Não. Nunca vendemos ou alugamos dados pessoais de usuários para terceiros. Período.',
      },
    ],
  },
  {
    icon: Zap,
    label: 'Premium e Beta',
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
    items: [
      {
        q: 'O que é o plano Premium?',
        a: 'Estamos desenvolvendo planos pagos com funcionalidades avançadas como notificações personalizadas, download de conteúdo, acesso antecipado a novos recursos e muito mais. Veja detalhes em /premium.',
      },
      {
        q: 'Como registro interesse no Premium?',
        a: 'Acesse /premium e clique em "Quero ser VIP". Você receberá 40% de desconto vitalício quando o plano for lançado. O registro de interesse não gera cobrança imediata.',
      },
      {
        q: 'O HallyuHub está em beta?',
        a: 'Sim, estamos em fase beta pública. Isso significa que novas funcionalidades são lançadas frequentemente e você pode encontrar pequenas instabilidades. Seu feedback é muito valioso — use o botão de reportar problema em qualquer página.',
      },
      {
        q: 'Como reporto bugs ou sugiro melhorias?',
        a: 'Use o ícone de flag (⚑) disponível nas páginas de artistas, produções e grupos para reportar informações incorretas. Para sugestões gerais, entre em contato pelo e-mail contato@hallyuhub.com.br.',
      },
    ],
  },
]

function AccordionItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`border-b border-white/5 last:border-0 transition-colors ${open ? 'bg-white/[0.02]' : ''}`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-start justify-between gap-4 py-5 px-6 text-left group"
      >
        <span className={`font-bold text-sm leading-snug transition-colors ${open ? 'text-white' : 'text-zinc-300 group-hover:text-white'}`}>
          {q}
        </span>
        <ChevronDown
          size={16}
          className={`shrink-0 mt-0.5 text-zinc-500 transition-transform duration-200 ${open ? 'rotate-180 text-purple-400' : ''}`}
        />
      </button>
      {open && (
        <p className="px-6 pb-5 text-sm text-zinc-400 leading-relaxed">
          {a}
        </p>
      )}
    </div>
  )
}

export default function FAQPage() {
  const [activeSection, setActiveSection] = useState<string | null>(null)

  const filtered = activeSection
    ? SECTIONS.filter(s => s.label === activeSection)
    : SECTIONS

  return (
    <PageTransition className="pt-24 md:pt-32 pb-20 px-4 sm:px-8 md:px-12">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-purple-400 bg-purple-500/10 border border-purple-500/20 px-4 py-1.5 rounded-full mb-6">
            <HelpCircle size={10} /> Perguntas frequentes
          </span>
          <h1 className="text-4xl md:text-6xl font-display font-black text-white uppercase italic tracking-tight leading-none mb-4">
            Tire suas<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              dúvidas
            </span>
          </h1>
          <p className="text-zinc-400 text-base max-w-lg mx-auto">
            Tudo que você precisa saber sobre o HallyuHub em um só lugar.
          </p>
        </div>

        {/* Filtro por categoria */}
        <div className="flex flex-wrap gap-2 justify-center mb-10">
          <button
            onClick={() => setActiveSection(null)}
            className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full transition-colors ${
              !activeSection ? 'bg-purple-600 text-white' : 'bg-zinc-900 text-zinc-400 border border-white/5 hover:text-white'
            }`}
          >
            Todos
          </button>
          {SECTIONS.map(s => (
            <button
              key={s.label}
              onClick={() => setActiveSection(activeSection === s.label ? null : s.label)}
              className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full transition-colors ${
                activeSection === s.label ? 'bg-purple-600 text-white' : 'bg-zinc-900 text-zinc-400 border border-white/5 hover:text-white'
              }`}
            >
              <s.icon size={10} />
              {s.label}
            </button>
          ))}
        </div>

        {/* Seções */}
        <div className="space-y-6">
          {filtered.map(section => (
            <div key={section.label}>
              <div className="flex items-center gap-2 mb-3">
                <div className={`p-1.5 rounded-lg ${section.bg}`}>
                  <section.icon size={14} className={section.color} />
                </div>
                <h2 className="text-xs font-black uppercase tracking-widest text-zinc-500">{section.label}</h2>
              </div>
              <div className="glass-card border-white/5 rounded-2xl overflow-hidden">
                {section.items.map(item => (
                  <AccordionItem key={item.q} q={item.q} a={item.a} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* CTA de contato */}
        <div className="mt-12 p-8 glass-card border-white/5 rounded-2xl text-center">
          <p className="text-zinc-400 text-sm mb-4">
            Não encontrou o que procurava?
          </p>
          <a
            href="mailto:contato@hallyuhub.com.br"
            className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest px-6 py-3 bg-purple-600 text-white rounded-full hover:bg-purple-500 transition-colors"
          >
            Entrar em contato
          </a>
        </div>

        {/* Links relacionados */}
        <div className="mt-8 flex items-center justify-center gap-6 text-xs text-zinc-600">
          <Link href="/termos" className="hover:text-zinc-400 transition-colors">Termos de Uso</Link>
          <span>·</span>
          <Link href="/privacidade" className="hover:text-zinc-400 transition-colors">Privacidade</Link>
          <span>·</span>
          <Link href="/about" className="hover:text-zinc-400 transition-colors">Sobre nós</Link>
        </div>

      </div>
    </PageTransition>
  )
}
