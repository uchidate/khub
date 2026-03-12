'use client'

import { useState } from 'react'
import { Send, Loader2, CheckCircle, AlertCircle } from 'lucide-react'

const SUBJECTS = [
    'Dúvida geral',
    'Sugestão de melhoria',
    'Reportar erro ou bug',
    'Conteúdo incorreto',
    'Proposta de parceria',
    'Imprensa e mídia',
    'Outro',
]

type Status = 'idle' | 'sending' | 'success' | 'error'

export function ContactForm() {
    const [status, setStatus] = useState<Status>('idle')
    const [form, setForm] = useState({ name: '', email: '', subject: SUBJECTS[0], message: '' })

    function set(field: string, value: string) {
        setForm(prev => ({ ...prev, [field]: value }))
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setStatus('sending')
        try {
            const res = await fetch('/api/contato', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            })
            if (!res.ok) throw new Error()
            setStatus('success')
            setForm({ name: '', email: '', subject: SUBJECTS[0], message: '' })
        } catch {
            setStatus('error')
        }
    }

    if (status === 'success') {
        return (
            <div className="flex flex-col items-center text-center py-8 gap-4">
                <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <CheckCircle className="w-7 h-7 text-emerald-400" />
                </div>
                <h3 className="text-lg font-bold text-white">Mensagem enviada!</h3>
                <p className="text-sm text-zinc-400 max-w-sm">
                    Recebemos seu contato e responderemos em até 48h úteis no e-mail informado.
                </p>
                <button
                    onClick={() => setStatus('idle')}
                    className="text-xs text-purple-400 hover:text-purple-300 underline underline-offset-4 transition-colors"
                >
                    Enviar outra mensagem
                </button>
            </div>
        )
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">
                        Nome *
                    </label>
                    <input
                        type="text"
                        required
                        value={form.name}
                        onChange={e => set('name', e.target.value)}
                        placeholder="Seu nome"
                        className="w-full bg-zinc-900 border border-white/8 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500/50 transition-colors"
                    />
                </div>
                <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">
                        E-mail *
                    </label>
                    <input
                        type="email"
                        required
                        value={form.email}
                        onChange={e => set('email', e.target.value)}
                        placeholder="seu@email.com"
                        className="w-full bg-zinc-900 border border-white/8 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500/50 transition-colors"
                    />
                </div>
            </div>

            <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">
                    Assunto *
                </label>
                <select
                    required
                    value={form.subject}
                    onChange={e => set('subject', e.target.value)}
                    className="w-full bg-zinc-900 border border-white/8 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500/50 transition-colors appearance-none cursor-pointer"
                >
                    {SUBJECTS.map(s => (
                        <option key={s} value={s}>{s}</option>
                    ))}
                </select>
            </div>

            <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">
                    Mensagem *
                </label>
                <textarea
                    required
                    rows={5}
                    value={form.message}
                    onChange={e => set('message', e.target.value)}
                    placeholder="Escreva sua mensagem aqui..."
                    minLength={20}
                    className="w-full bg-zinc-900 border border-white/8 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500/50 transition-colors resize-y"
                />
            </div>

            {status === 'error' && (
                <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                    <AlertCircle size={15} />
                    Erro ao enviar. Tente novamente ou escreva para contato@hallyuhub.com.br
                </div>
            )}

            <button
                type="submit"
                disabled={status === 'sending'}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-sm transition-colors"
            >
                {status === 'sending'
                    ? <><Loader2 size={16} className="animate-spin" /> Enviando...</>
                    : <><Send size={16} /> Enviar mensagem</>
                }
            </button>
        </form>
    )
}
