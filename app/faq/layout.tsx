import type { Metadata } from 'next'
import { JsonLd } from '@/components/seo/JsonLd'

export const metadata: Metadata = {
  title: 'Perguntas Frequentes (FAQ) | HallyuHub',
  description: 'Tire suas dúvidas sobre o HallyuHub — a maior plataforma de cultura coreana em português. Saiba sobre conta, favoritos, notícias, premium e muito mais.',
  openGraph: {
    title: 'Perguntas Frequentes | HallyuHub',
    description: 'Tire suas dúvidas sobre o HallyuHub — a maior plataforma de cultura coreana em português.',
    url: 'https://www.hallyuhub.com.br/faq',
    type: 'website',
  },
}

const FAQ_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'O que é o HallyuHub?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'O HallyuHub é o maior portal de cultura coreana em português. Reunimos perfis detalhados de artistas K-Pop, grupos, dramas, filmes e notícias traduzidas, tudo em um só lugar para fãs brasileiros e lusófonos.',
      },
    },
    {
      '@type': 'Question',
      name: 'O site é gratuito?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Sim! O acesso básico ao HallyuHub é completamente gratuito. Você pode explorar perfis de artistas, assistir notícias traduzidas e descobrir produções sem criar conta.',
      },
    },
    {
      '@type': 'Question',
      name: 'Preciso criar uma conta?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Não é obrigatório. Mas ao criar uma conta você pode favoritar artistas, produções e notícias, receber o feed personalizado de notícias dos seus artistas favoritos e comentar nas notícias.',
      },
    },
    {
      '@type': 'Question',
      name: 'De onde vêm as notícias?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Coletamos notícias de fontes especializadas em K-Pop e K-Drama como Soompi, Koreaboo, Dramabeans, Asian Junkie e outras. O conteúdo é traduzido automaticamente para português brasileiro.',
      },
    },
    {
      '@type': 'Question',
      name: 'Como funciona o sistema de favoritos?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Clique no ícone de coração (♥) em qualquer artista, grupo, produção ou notícia. Os itens favoritados aparecem no seu painel e alimentam o Feed Personalizado em /news/feed.',
      },
    },
    {
      '@type': 'Question',
      name: 'O HallyuHub tem aplicativo?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Ainda não temos um app nativo, mas o site é totalmente responsivo e funciona muito bem em celulares. Você também pode adicioná-lo à tela inicial do seu smartphone — ele funciona como um PWA (Progressive Web App).',
      },
    },
    {
      '@type': 'Question',
      name: 'Como meus dados são protegidos?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Seus dados são armazenados em servidores seguros com criptografia em trânsito (HTTPS/TLS). Não compartilhamos informações pessoais com terceiros para fins publicitários.',
      },
    },
    {
      '@type': 'Question',
      name: 'O HallyuHub está em beta?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Sim, estamos em fase beta pública. Isso significa que novas funcionalidades são lançadas frequentemente e você pode encontrar pequenas instabilidades. Seu feedback é muito valioso.',
      },
    },
  ],
}

export default function FAQLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={FAQ_SCHEMA} />
      {children}
    </>
  )
}
