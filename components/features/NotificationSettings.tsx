'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, Mail, Clock, Users, Info, Loader2 } from 'lucide-react'

interface NotificationSettingsProps {
    settings: {
        id: string
        emailOnNewNews: boolean
        emailDigestEnabled: boolean
        emailDigestFrequency: string
        emailDigestTime: string
        onlyFavoriteArtists: boolean
        minNewsImportance: string
    }
    favoriteArtistsCount: number
    favoriteArtists: string[]
}

export function NotificationSettings({
    settings,
    favoriteArtistsCount,
    favoriteArtists,
}: NotificationSettingsProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [isSaved, setIsSaved] = useState(false)

    const [formData, setFormData] = useState({
        emailOnNewNews: settings.emailOnNewNews,
        emailDigestEnabled: settings.emailDigestEnabled,
        emailDigestFrequency: settings.emailDigestFrequency,
        emailDigestTime: settings.emailDigestTime,
        onlyFavoriteArtists: settings.onlyFavoriteArtists,
        minNewsImportance: settings.minNewsImportance,
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
            {/* Info sobre artistas favoritos */}
            {favoriteArtistsCount > 0 ? (
                <div className="p-6 rounded-xl bg-purple-500/10 border border-purple-500/30">
                    <div className="flex items-start gap-4">
                        <Users className="w-6 h-6 text-purple-400 flex-shrink-0 mt-1" />
                        <div>
                            <h3 className="font-bold text-white mb-2">
                                Você segue {favoriteArtistsCount} artista{favoriteArtistsCount > 1 ? 's' : ''}
                            </h3>
                            <p className="text-sm text-zinc-400 mb-2">
                                {favoriteArtists.join(', ')}
                                {favoriteArtistsCount > 5 && ` e mais ${favoriteArtistsCount - 5}`}
                            </p>
                            <p className="text-xs text-zinc-500">
                                Notificações serão enviadas quando houver notícias sobre esses artistas
                            </p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="p-6 rounded-xl bg-zinc-900/50 border border-white/10">
                    <div className="flex items-start gap-4">
                        <Info className="w-6 h-6 text-zinc-500 flex-shrink-0 mt-1" />
                        <div>
                            <h3 className="font-bold text-white mb-2">
                                Você ainda não segue nenhum artista
                            </h3>
                            <p className="text-sm text-zinc-400 mb-3">
                                Favorite artistas para receber notificações quando houver notícias sobre eles
                            </p>
                            <a
                                href="/artists"
                                className="inline-flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 transition-colors"
                            >
                                Explorar Artistas →
                            </a>
                        </div>
                    </div>
                </div>
            )}

            {/* Notificações Instantâneas */}
            <div className="p-6 rounded-xl bg-zinc-900/50 border border-white/10">
                <div className="flex items-start gap-4 mb-4">
                    <Bell className="w-6 h-6 text-purple-400 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                        <h3 className="font-bold text-white mb-2">Notificações Instantâneas</h3>
                        <p className="text-sm text-zinc-400 mb-4">
                            Receba um email imediatamente quando uma notícia sobre seus artistas favoritos for publicada
                        </p>

                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.emailOnNewNews}
                                onChange={(e) =>
                                    setFormData({ ...formData, emailOnNewNews: e.target.checked })
                                }
                                className="w-5 h-5 rounded border-zinc-700 bg-zinc-800 text-purple-500 focus:ring-2 focus:ring-purple-500/50"
                            />
                            <span className="text-sm text-zinc-300">
                                Ativar notificações por email
                            </span>
                        </label>
                    </div>
                </div>
            </div>

            {/* Email Digest */}
            <div className="p-6 rounded-xl bg-zinc-900/50 border border-white/10">
                <div className="flex items-start gap-4 mb-4">
                    <Mail className="w-6 h-6 text-purple-400 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                        <h3 className="font-bold text-white mb-2">Resumo de Notícias</h3>
                        <p className="text-sm text-zinc-400 mb-6">
                            Receba um resumo periódico com todas as notícias dos seus artistas favoritos
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
                                    className="w-5 h-5 rounded border-zinc-700 bg-zinc-800 text-purple-500 focus:ring-2 focus:ring-purple-500/50"
                                />
                                <span className="text-sm text-zinc-300">
                                    Ativar resumo de notícias
                                </span>
                            </label>

                            {/* Frequência */}
                            {formData.emailDigestEnabled && (
                                <div className="ml-8 space-y-4 pt-4 border-t border-white/5">
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-300 mb-2">
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
                                            className="w-full px-4 py-2 bg-zinc-800 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20"
                                        >
                                            <option value="DAILY">Diário</option>
                                            <option value="WEEKLY">Semanal (Segunda-feira)</option>
                                            <option value="NEVER">Desativado</option>
                                        </select>
                                        <p className="text-xs text-zinc-500 mt-2">
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
                                            <label className="block text-sm font-medium text-zinc-300 mb-2">
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
                                                className="px-4 py-2 bg-zinc-800 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20"
                                            />
                                            <p className="text-xs text-zinc-500 mt-2">
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
                <div className="text-sm text-zinc-500">
                    {isSaved && (
                        <span className="text-green-400">
                            ✓ Configurações salvas com sucesso!
                        </span>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
