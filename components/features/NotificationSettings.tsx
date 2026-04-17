'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, Mail, Clock, Loader2 } from 'lucide-react'

interface NotificationSettingsProps {
    settings: {
        id: string
        emailOnNewBlog: boolean
        emailDigestEnabled: boolean
        emailDigestFrequency: string
        emailDigestTime: string
    }
}

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

            if (!response.ok) {
                throw new Error('Failed to save settings')
            }

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
        <form onSubmit={handleSubmit} className="space-y-8">
            {/* Notificações Instantâneas */}
            <div className="p-6 rounded-xl bg-surface border border-border">
                <div className="flex items-start gap-4 mb-4">
                    <Bell className="w-6 h-6 text-accent flex-shrink-0 mt-1" />
                    <div className="flex-1">
                        <h3 className="font-bold text-foreground mb-2">Novos Artigos</h3>
                        <p className="text-sm text-muted mb-4">
                            Receba um email imediatamente quando um novo artigo for publicado no blog do HallyuHub
                        </p>

                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.emailOnNewBlog}
                                onChange={(e) =>
                                    setFormData({ ...formData, emailOnNewBlog: e.target.checked })
                                }
                                className="w-5 h-5 rounded border-border bg-background text-accent focus:ring-2 focus:ring-[#ff2d78]/30"
                            />
                            <span className="text-sm text-foreground">
                                Ativar notificações de novos artigos
                            </span>
                        </label>
                    </div>
                </div>
            </div>

            {/* Email Digest */}
            <div className="p-6 rounded-xl bg-surface border border-border">
                <div className="flex items-start gap-4 mb-4">
                    <Mail className="w-6 h-6 text-accent flex-shrink-0 mt-1" />
                    <div className="flex-1">
                        <h3 className="font-bold text-foreground mb-2">Digest de Artigos</h3>
                        <p className="text-sm text-muted mb-6">
                            Receba um resumo periódico com os artigos mais recentes publicados no HallyuHub
                        </p>

                        <div className="space-y-4">
                            {/* Toggle Digest */}
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.emailDigestEnabled}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            emailDigestEnabled: e.target.checked,
                                        })
                                    }
                                    className="w-5 h-5 rounded border-border bg-background text-accent focus:ring-2 focus:ring-[#ff2d78]/30"
                                />
                                <span className="text-sm text-foreground">
                                    Ativar digest de artigos
                                </span>
                            </label>

                            {/* Frequência */}
                            {formData.emailDigestEnabled && (
                                <div className="ml-8 space-y-4 pt-4 border-t border-border">
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">
                                            <Clock className="inline w-4 h-4 mr-2" />
                                            Frequência
                                        </label>
                                        <select
                                            value={formData.emailDigestFrequency}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    emailDigestFrequency: e.target.value,
                                                })
                                            }
                                            className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-[#ff2d78]/20"
                                        >
                                            <option value="DAILY">Diário</option>
                                            <option value="WEEKLY">Semanal (Segunda-feira)</option>
                                            <option value="NEVER">Desativado</option>
                                        </select>
                                        <p className="text-xs text-muted mt-2">
                                            {formData.emailDigestFrequency === 'DAILY' &&
                                                'Você receberá um resumo todos os dias'}
                                            {formData.emailDigestFrequency === 'WEEKLY' &&
                                                'Você receberá um resumo toda segunda-feira'}
                                            {formData.emailDigestFrequency === 'NEVER' &&
                                                'Você não receberá resumos'}
                                        </p>
                                    </div>

                                    {formData.emailDigestFrequency !== 'NEVER' && (
                                        <div>
                                            <label className="block text-sm font-medium text-foreground mb-2">
                                                Horário de envio
                                            </label>
                                            <input
                                                type="time"
                                                value={formData.emailDigestTime}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        emailDigestTime: e.target.value,
                                                    })
                                                }
                                                className="px-4 py-2 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-[#ff2d78]/20"
                                            />
                                            <p className="text-xs text-muted mt-2">
                                                Horário aproximado (pode variar em até 1 hora)
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Botão Salvar */}
            <div className="flex items-center justify-between pt-6">
                <div className="text-sm text-muted">
                    {isSaved && (
                        <span className="text-green-600">
                            ✓ Configurações salvas com sucesso!
                        </span>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="flex items-center gap-2 px-6 py-3 bg-accent text-white font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Salvando...</span>
                        </>
                    ) : (
                        <>
                            <Bell className="w-5 h-5" />
                            <span>Salvar Configurações</span>
                        </>
                    )}
                </button>
            </div>
        </form>
    )
}
