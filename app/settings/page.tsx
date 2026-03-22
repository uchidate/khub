import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Settings, Bell, Lock, Eye, Globe, Palette, Shield } from 'lucide-react'

export default async function SettingsPage() {
  const session = await auth()

  if (!session) {
    redirect('/auth/login?callbackUrl=/settings')
  }

  const settingsSections = [
    {
      title: 'Notificações',
      description: 'Gerencie suas preferências de notificação',
      icon: Bell,
      settings: [
        { label: 'Notificações por email', enabled: true },
        { label: 'Notificações push', enabled: false },
        { label: 'Atualizações de artistas favoritos', enabled: true },
      ],
    },
    {
      title: 'Conteúdo',
      description: 'Controle quais classificações etárias você deseja ver',
      icon: Shield,
      href: '/settings/content-preferences',
      isLink: true,
    },
    {
      title: 'Privacidade',
      description: 'Controle quem pode ver suas informações',
      icon: Eye,
      settings: [
        { label: 'Perfil público', enabled: true },
        { label: 'Mostrar favoritos', enabled: false },
        { label: 'Atividade visível', enabled: true },
      ],
    },
    {
      title: 'Preferências',
      description: 'Personalize sua experiência',
      icon: Palette,
      settings: [
        { label: 'Modo escuro', enabled: true },
        { label: 'Reprodução automática', enabled: false },
        { label: 'Qualidade HD', enabled: true },
      ],
    },
    {
      title: 'Idioma e Região',
      description: 'Configure idioma e localização',
      icon: Globe,
      settings: [
        { label: 'Português (Brasil)', enabled: true },
        { label: 'Fuso horário automático', enabled: true },
      ],
    },
  ]

  return (
    <div className="min-h-screen bg-background py-8 md:py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12 animate-fade-in">
          <div className="flex items-center gap-3 mb-4">
            <Settings className="text-[#ff2d78]" size={40} />
            <h1 className="text-4xl md:text-5xl font-black text-foreground">Configurações</h1>
          </div>
          <p className="text-xl text-muted">Personalize sua experiência no HallyuHub</p>
        </div>

        {/* Settings Sections */}
        <div className="space-y-6 mb-8">
          {settingsSections.map((section: any, index: number) => {
            // Renderizar seção com link (ex: Conteúdo)
            if (section.isLink && section.href) {
              return (
                <Link
                  key={section.title}
                  href={section.href}
                  className="block bg-background border border-border hover:border-[#ff2d78]/50 rounded-2xl p-8 animate-slide-up transition-all group"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-[#ff2d78]/10 group-hover:bg-[#ff2d78]/20 rounded-lg flex items-center justify-center transition-colors">
                      <section.icon className="text-[#ff2d78]" size={24} />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl font-bold text-foreground mb-1 group-hover:text-[#ff2d78] transition-colors">{section.title}</h2>
                      <p className="text-sm text-muted">{section.description}</p>
                    </div>
                    <div className="text-[#ff2d78] opacity-0 group-hover:opacity-100 transition-opacity">
                      →
                    </div>
                  </div>
                </Link>
              )
            }

            // Renderizar seção normal (com settings)
            return (
              <div
                key={section.title}
                className="bg-background border border-border rounded-2xl p-8 animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 bg-[#ff2d78]/10 rounded-lg flex items-center justify-center">
                    <section.icon className="text-[#ff2d78]" size={24} />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-foreground mb-1">{section.title}</h2>
                    <p className="text-sm text-muted">{section.description}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {section.settings?.map((setting: any) => (
                    <div
                      key={setting.label}
                      className="flex items-center justify-between py-3 border-t border-border first:border-t-0"
                    >
                      <span className="text-foreground">{setting.label}</span>
                      <button
                        className={`relative w-14 h-7 rounded-full transition-colors ${
                          setting.enabled ? 'bg-[#ff2d78]' : 'bg-[#e8e8e8]'
                        }`}
                      >
                        <div
                          className={`absolute top-1 left-1 w-5 h-5 bg-background rounded-full transition-transform ${
                            setting.enabled ? 'translate-x-7' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}

          {/* Security Section */}
          <div className="bg-background border border-border rounded-2xl p-8 animate-slide-up">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-red-500/10 rounded-lg flex items-center justify-center">
                <Lock className="text-red-500" size={24} />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-foreground mb-1">Segurança</h2>
                <p className="text-sm text-muted">Gerencie senha e autenticação</p>
              </div>
            </div>

            <div className="space-y-4">
              <Link
                href="/auth/forgot-password"
                className="block w-full px-6 py-3 bg-surface text-foreground font-medium rounded-lg hover:bg-[#e8e8e8] transition-colors text-center"
              >
                Alterar Senha
              </Link>
              <button className="w-full px-6 py-3 bg-surface text-foreground font-medium rounded-lg hover:bg-[#e8e8e8] transition-colors">
                Autenticação de Dois Fatores
              </button>
              <button className="w-full px-6 py-3 bg-surface text-foreground font-medium rounded-lg hover:bg-[#e8e8e8] transition-colors">
                Sessões Ativas
              </button>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-background border border-red-500/20 rounded-2xl p-8 animate-slide-up">
            <h2 className="text-xl font-bold text-red-500 mb-4">Zona de Perigo</h2>
            <p className="text-muted mb-6">
              Ações irreversíveis que afetam sua conta permanentemente
            </p>
            <button className="px-6 py-3 bg-red-500/10 text-red-500 font-medium rounded-lg hover:bg-red-500/20 transition-colors border border-red-500/20">
              Excluir Conta
            </button>
          </div>
        </div>

        {/* Back Links */}
        <div className="flex gap-4">
          <Link
            href="/dashboard"
            className="text-[#ff2d78] hover:text-[#ff2d78] transition-colors"
          >
            ← Voltar ao Dashboard
          </Link>
          <Link
            href=""
            className="text-[#ff2d78] hover:text-[#ff2d78] transition-colors"
          >
            ← Voltar ao Início
          </Link>
        </div>
      </div>
    </div>
  )
}
