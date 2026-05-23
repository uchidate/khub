'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, ArrowLeft, KeyRound, CheckCircle } from 'lucide-react'
import { AuthCard, AuthError, AuthInput, AuthSubmitButton } from '@/components/auth/AuthCard'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [resetUrl, setResetUrl] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await response.json()
      if (!response.ok) { setError(data.error || 'Erro ao processar solicitação'); setIsLoading(false); return }
      setSuccess(true)
      if (data.resetUrl && process.env.NODE_ENV === 'development') setResetUrl(data.resetUrl)
    } catch {
      setError('Erro ao enviar email. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <AuthCard>
        <div className="text-center py-4">
          <div className="w-14 h-14 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="text-green-500" size={26} />
          </div>
          <h2 className="text-xl font-black text-foreground mb-1">Email enviado!</h2>
          <p className="text-muted text-sm mb-6">
            Se o email existir em nosso sistema, você receberá um link para redefinir sua senha.
          </p>
          {resetUrl && (
            <div className="mb-6 p-3.5 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-left">
              <p className="text-[11px] text-yellow-400 mb-1.5 font-bold uppercase tracking-wide">🔧 Dev — link de reset:</p>
              <a href={resetUrl} className="text-xs text-[#ff2d78] break-all hover:underline" target="_blank" rel="noopener noreferrer">{resetUrl}</a>
            </div>
          )}
          <div className="space-y-2.5">
            <Link href="/auth/login" className="block w-full py-3 bg-foreground text-background text-sm font-semibold rounded-full hover:bg-accent hover:text-white transition-colors">
              Voltar para login
            </Link>
            <button onClick={() => { setSuccess(false); setEmail('') }}
              className="block w-full py-3 border border-border text-foreground text-sm font-semibold rounded-full hover:bg-surface transition-colors">
              Tentar outro email
            </button>
          </div>
        </div>
      </AuthCard>
    )
  }

  return (
    <AuthCard>
      <div className="w-11 h-11 bg-[#ff2d78]/10 border border-[#ff2d78]/20 rounded-xl flex items-center justify-center mb-5">
        <KeyRound className="text-[#ff2d78]" size={20} />
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-black text-foreground">Esqueceu sua senha?</h1>
        <p className="text-muted text-sm mt-1">Digite seu email e enviaremos um link de recuperação.</p>
      </div>

      <AuthError message={error} />

      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthInput id="email" label="Email" type="email" value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="seu@email.com" disabled={isLoading} required icon={<Mail size={16} />} />
        <AuthSubmitButton isLoading={isLoading} label="Enviar link de recuperação" />
      </form>

      <Link href="/auth/login" className="mt-6 flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors">
        <ArrowLeft size={14} /> Voltar para login
      </Link>
    </AuthCard>
  )
}
