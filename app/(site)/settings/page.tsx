import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, Eye, Palette } from 'lucide-react'
import { accountNavGroups } from '@/lib/config/account-navigation'

export default async function SettingsPage() {
  const session = await auth()
  if (!session) redirect('/auth/login?callbackUrl=/settings')

  const firstName = session.user.name?.split(' ')[0] ?? 'sua conta'
  const isStaff = ['admin', 'editor'].includes(session.user.role?.toLowerCase() ?? '')

  const preferenceRoutes = accountNavGroups.find(group => group.label === 'Preferências')?.items ?? []
  const accountRoutes = accountNavGroups.filter(group => group.label !== 'Preferências')
  const quickLinks = [
    ...accountRoutes.flatMap(group => group.items),
    { label: 'Aparência do site', href: '#appearance', icon: Palette },
  ]

  return (
    <main className="min-h-screen bg-background pb-12">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <header className="mb-5 rounded-3xl border border-border bg-surface p-5 shadow-sm sm:p-6">
          <p className="mb-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-accent">Central da conta</p>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
                Configurações de {firstName}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-5 text-muted">
                Um lugar único para ajustar notificações, privacidade, conteúdo, segurança e atalhos da sua experiência no HallyuHub.
              </p>
            </div>
            {isStaff && (
              <Link
                href="/admin/settings"
                className="inline-flex w-fit items-center gap-2 rounded-full bg-foreground px-4 py-2 text-xs font-black text-background transition-colors hover:bg-accent hover:text-white"
              >
                Painel do sistema
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
        </header>

        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {preferenceRoutes.map(({ key, label, description, href, icon: Icon }) => (
            <Link
              key={key}
              href={href}
              className="group rounded-3xl border border-border bg-surface p-4 shadow-sm transition-colors hover:border-accent/40 hover:bg-surface-hover"
            >
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-accent-soft text-accent">
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-sm font-black text-foreground group-hover:text-accent">{label}</h2>
                    <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted transition-colors group-hover:text-accent" />
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted">{description}</p>
                </div>
              </div>
            </Link>
          ))}
        </section>

        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
          <section id="appearance" className="rounded-3xl border border-border bg-surface p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-background text-accent">
                <Eye className="h-4 w-4" />
              </span>
              <div>
                <h2 className="text-lg font-black text-foreground">Preferências globais</h2>
                <p className="text-sm text-muted">Estado atual das opções que já existem no site.</p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ['Tema', 'Use o botão de tema na barra superior para alternar claro/escuro.'],
                ['Conteúdo sensível', 'Ajuste na tela de preferências de conteúdo.'],
                ['Alertas personalizados', 'Gerencie por email em notificações.'],
                ['Coleções pessoais', 'Favoritos e Minha Lista ficam sincronizados na sua conta.'],
              ].map(([label, text]) => (
                <div key={label} className="rounded-2xl border border-border bg-background p-3">
                  <p className="text-sm font-black text-foreground">{label}</p>
                  <p className="mt-1 text-xs leading-5 text-muted">{text}</p>
                </div>
              ))}
            </div>
          </section>

          <aside className="rounded-3xl border border-border bg-surface p-4 shadow-sm">
            <p className="mb-3 text-xs font-black uppercase tracking-[0.14em] text-muted">Atalhos</p>
            <div className="space-y-1">
              {quickLinks.map(({ label, href, icon: Icon }) => (
                <Link key={label} href={href} className="group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-bold text-foreground transition-colors hover:bg-background">
                  <Icon className="h-4 w-4 text-muted group-hover:text-accent" />
                  <span>{label}</span>
                  <ChevronRight className="ml-auto h-4 w-4 text-muted" />
                </Link>
              ))}
            </div>
          </aside>
        </div>

        <section className="mt-5 rounded-3xl border border-red-500/20 bg-red-500/5 p-5">
          <h2 className="text-lg font-black text-red-500">Zona sensível</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Exclusão de conta e exportação completa de dados devem ficar atrás de confirmação explícita. Mantive esta área informativa até existir fluxo seguro de backend para essas ações.
          </p>
        </section>
      </div>
    </main>
  )
}
