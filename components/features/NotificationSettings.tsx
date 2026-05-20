'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, BookOpen, CheckCircle2, Clock, Loader2, Mail, Sparkles, Star } from 'lucide-react'

interface NotificationSettingsProps {
    settings: {
        id: string
        emailOnNewBlog: boolean
        emailDigestEnabled: boolean
        emailDigestFrequency: string
        emailDigestTime: string
    }
}

const frequencyOptions = [
    { value: 'DAILY', label: 'Diário', description: 'Resumo todos os dias.' },
    { value: 'WEEKLY', label: 'Semanal', description: 'Resumo toda segunda-feira.' },
    { value: 'NEVER', label: 'Sem resumo', description: 'Não enviar digest.' },
]

export function NotificationSettings({ settings }: NotificationSettingsProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [isSaved, setIsSaved] = useState(false)

    const [formData, setFormData] = useState({
        emailOnNewBlog: settings.emailOnNewBlog,
        emailDigestEnabled: settings.emailDigestEnabled,
        emailDigestFrequency: settings.emailDigestFrequency,
        emailDigestTime: settings.emailDigestTime,
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setIsSaved(false)

        try {
            const response = await fetch('/api/settings/notifications', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            })

            if (!response.ok) throw new Error('Failed to save settings')

            setIsSaved(true)
            setTimeout(() => setIsSaved(false), 3000)
            router.refresh()
        } catch (error) {
            console.error('Error saving settings:', error)
            alert('Erro ao salvar configurações. Tente novamente.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <section className="grid gap-3 md:grid-cols-3">
                {[
                    {
                        icon: Bell,
                        title: 'Sininho',
                        text: 'Mostra artigos ligados aos artistas que você favoritou.',
                    },
                    {
                        icon: Sparkles,
                        title: 'Descobrir',
                        text: 'Quando não há alertas novos, mostra artigos recentes para leitura.',
                    },
                    {
                        icon: Star,
                        title: 'Favoritos',
                        text: 'Quanto melhor sua curadoria, mais úteis ficam os alertas.',
                    },
                ].map(({ icon: Icon, title, text }) => (
                    <div key={title} className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
                        <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-accent-soft text-accent">
                            <Icon className="h-4 w-4" />
                        </span>
                        <h3 className="text-sm font-black text-foreground">{title}</h3>
                        <p className="mt-1 text-xs leading-5 text-muted">{text}</p>
                    </div>
                ))}
            </section>

            <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
                <div className="mb-4 flex items-start gap-3">
                    <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-background text-accent">
                        <BookOpen className="h-5 w-5" />
                    </span>
                    <div>
                        <h3 className="text-lg font-black text-foreground">Artigos novos</h3>
                        <p className="mt-1 text-sm leading-5 text-muted">
                            Email instantâneo quando um novo artigo for publicado. O sininho do site continua priorizando artigos relacionados aos seus favoritos.
                        </p>
                    </div>
                </div>

                <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-border bg-background p-4">
                    <span>
                        <span className="block text-sm font-black text-foreground">Receber email de novos artigos</span>
                        <span className="mt-1 block text-xs leading-5 text-muted">Útil para acompanhar publicações importantes sem abrir o site.</span>
                    </span>
                    <input
                        type="checkbox"
                        checked={formData.emailOnNewBlog}
                        onChange={(e) => setFormData({ ...formData, emailOnNewBlog: e.target.checked })}
                        className="h-5 w-5 rounded border-border bg-background text-accent focus:ring-2 focus:ring-[#ff2d78]/30"
                    />
                </label>
            </section>

            <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
                <div className="mb-4 flex items-start gap-3">
                    <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-background text-accent">
                        <Mail className="h-5 w-5" />
                    </span>
                    <div>
                        <h3 className="text-lg font-black text-foreground">Resumo por email</h3>
                        <p className="mt-1 text-sm leading-5 text-muted">
                            Um digest com artigos recentes para quem prefere acompanhar em bloco.
                        </p>
                    </div>
                </div>

                <label className="mb-4 flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-border bg-background p-4">
                    <span>
                        <span className="block text-sm font-black text-foreground">Ativar resumo</span>
                        <span className="mt-1 block text-xs leading-5 text-muted">Você escolhe a frequência e o horário aproximado.</span>
                    </span>
                    <input
                        type="checkbox"
                        checked={formData.emailDigestEnabled}
                        onChange={(e) => setFormData({ ...formData, emailDigestEnabled: e.target.checked })}
                        className="h-5 w-5 rounded border-border bg-background text-accent focus:ring-2 focus:ring-[#ff2d78]/30"
                    />
                </label>

                {formData.emailDigestEnabled && (
                    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
                        <div className="grid gap-2 sm:grid-cols-3">
                            {frequencyOptions.map(option => {
                                const active = formData.emailDigestFrequency === option.value
                                return (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, emailDigestFrequency: option.value })}
                                        className={`rounded-2xl border p-4 text-left transition-colors ${
                                            active
                                                ? 'border-foreground bg-foreground text-background'
                                                : 'border-border bg-background text-foreground hover:border-accent/40'
                                        }`}
                                    >
                                        <span className="flex items-center gap-2 text-sm font-black">
                                            {active && <CheckCircle2 className="h-4 w-4" />}
                                            {option.label}
                                        </span>
                                        <span className={`mt-1 block text-xs leading-5 ${active ? 'text-background/70' : 'text-muted'}`}>
                                            {option.description}
                                        </span>
                                    </button>
                                )
                            })}
                        </div>

                        {formData.emailDigestFrequency !== 'NEVER' && (
                            <label className="rounded-2xl border border-border bg-background p-4">
                                <span className="mb-2 flex items-center gap-2 text-sm font-black text-foreground">
                                    <Clock className="h-4 w-4 text-accent" />
                                    Horário
                                </span>
                                <input
                                    type="time"
                                    value={formData.emailDigestTime}
                                    onChange={(e) => setFormData({ ...formData, emailDigestTime: e.target.value })}
                                    className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-[#ff2d78]/20"
                                />
                                <span className="mt-2 block text-xs leading-5 text-muted">Envio aproximado.</span>
                            </label>
                        )}
                    </div>
                )}
            </section>

            <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-muted">
                    {isSaved ? (
                        <span className="font-bold text-green-600">Configurações salvas.</span>
                    ) : (
                        'Suas preferências afetam emails; o sininho usa artigos e favoritos dentro do site.'
                    )}
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-accent px-5 py-3 text-sm font-black text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Salvando...
                        </>
                    ) : (
                        <>
                            <Bell className="h-5 w-5" />
                            Salvar alertas
                        </>
                    )}
                </button>
            </div>
        </form>
    )
}
