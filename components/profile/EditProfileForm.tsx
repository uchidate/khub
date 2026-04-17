'use client'

import { useState } from 'react'
import { Pencil, X, Check, Loader2 } from 'lucide-react'

interface EditProfileFormProps {
    name: string | null
    bio: string | null
}

export function EditProfileForm({ name, bio }: EditProfileFormProps) {
    const [open, setOpen] = useState(false)
    const [formName, setFormName] = useState(name ?? '')
    const [formBio, setFormBio] = useState(bio ?? '')
    const [saving, setSaving] = useState(false)
    const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

    const showToast = (type: 'success' | 'error', msg: string) => {
        setToast({ type, msg })
        setTimeout(() => setToast(null), 3000)
    }

    const handleSave = async () => {
        if (formName.trim().length < 2) {
            showToast('error', 'Nome deve ter pelo menos 2 caracteres')
            return
        }
        setSaving(true)
        try {
            const res = await fetch('/api/users/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: formName.trim(), bio: formBio.trim() || null }),
            })
            if (!res.ok) {
                const err = await res.json()
                showToast('error', err.error || 'Erro ao salvar')
                return
            }
            showToast('success', 'Perfil atualizado! Recarregue para ver as mudanças.')
            setOpen(false)
        } catch {
            showToast('error', 'Erro de conexão')
        } finally {
            setSaving(false)
        }
    }

    return (
        <>
            {/* Toast */}
            {toast && (
                <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl text-sm font-bold shadow-xl transition-all ${
                    toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                }`}>
                    {toast.msg}
                </div>
            )}

            {/* Trigger button */}
            <button
                onClick={() => setOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#f5f5f7] hover:bg-[#e8e8e8] text-[#080808] text-xs font-bold rounded-xl transition-colors border border-[#e8e8e8] uppercase tracking-widest"
            >
                <Pencil size={14} />
                <span className="hidden sm:inline">Editar</span>
            </button>

            {/* Modal */}
            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="w-full max-w-md bg-white rounded-2xl border border-[#e8e8e8] shadow-2xl">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e8e8e8]">
                            <h2 className="text-lg font-black text-[#080808]">Editar Perfil</h2>
                            <button
                                onClick={() => setOpen(false)}
                                className="p-1.5 rounded-lg text-[#6b6b6b] hover:text-[#080808] hover:bg-[#f5f5f7] transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="p-6 space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-[#6b6b6b] uppercase tracking-wider mb-2">
                                    Nome
                                </label>
                                <input
                                    type="text"
                                    value={formName}
                                    onChange={e => setFormName(e.target.value)}
                                    maxLength={100}
                                    className="w-full bg-[#f5f5f7] border border-[#e8e8e8] rounded-xl px-4 py-3 text-[#080808] placeholder-[#6b6b6b] focus:outline-none focus:border-[#ff2d78] transition-colors text-sm"
                                    placeholder="Seu nome"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-[#6b6b6b] uppercase tracking-wider mb-2">
                                    Bio <span className="text-[#6b6b6b]/60 normal-case tracking-normal font-normal">{formBio.length}/300</span>
                                </label>
                                <textarea
                                    value={formBio}
                                    onChange={e => setFormBio(e.target.value.slice(0, 300))}
                                    rows={4}
                                    className="w-full bg-[#f5f5f7] border border-[#e8e8e8] rounded-xl px-4 py-3 text-[#080808] placeholder-[#6b6b6b] focus:outline-none focus:border-[#ff2d78] transition-colors text-sm resize-none"
                                    placeholder="Conte um pouco sobre você..."
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 px-6 pb-6">
                            <button
                                onClick={() => setOpen(false)}
                                className="flex-1 py-3 rounded-xl bg-[#f5f5f7] text-[#6b6b6b] hover:text-[#080808] hover:bg-[#e8e8e8] font-bold text-sm transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex-1 py-3 rounded-xl bg-[#ff2d78] hover:bg-[#ff2d78]/90 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                Salvar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
