'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, ArrowLeft, AlertCircle, CheckCircle, KeyRound } from 'lucide-react'
import { BrandMark } from '@/components/ui/BrandMark'

function BrandPanel() {
  return (
    <div className="hidden lg:flex w-[340px] shrink-0 flex-col justify-between bg-surface p-10 relative overflow-hidden">
      <div className="absolute -top-20 -left-20 w-80 h-80 bg-[#ff2d78]/15 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-10 right-0 w-60 h-60 bg-accent/10 rounded-full blur-[60px] pointer-events-none" />

      <Link href="/" className="flex items-center gap-2.5 relative z-10 hover:opacity-80 transition-opacity">
        <BrandMark size={30} />
        <span className="text-lg font-black tracking-[-0.02em] text-foreground">
          Hallyu<span className="text-[#ff2d78]">Hub</span>
        </span>
      </Link>

      <div className="relative z-10 space-y-3">
        <p className="text-2xl font-black text-foreground leading-tight">
          O portal do <span className="text-[#ff2d78]">K-Pop</span> e <br />
          da cultura coreana.
        </p>
        <p className="text-sm text-muted">
          Perfis de artistas, grupos, doramas e filmes — tudo em português.
        </p>
      </div>

      <div className="relative z-10 flex items-center gap-2 text-xs text-muted">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
        hallyuhub.com.br
      </div>
    </div>
  )
}

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
      if (!response.ok) {
        setError(data.error || 'Erro ao processar solicitação')
        setIsLoading(false)
        return
      }
      setSuccess(true)
      if (data.resetUrl) setResetUrl(data.resetUrl)
    } catch {
      setError('Erro ao enviar email. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-3xl border border-border rounded-2xl overflow-hidden flex">
          <BrandPanel />
          <div className="flex-1 flex items-center justify-center p-10 bg-background text-center">
            <div className="w-full max-w-sm">
              <div className="w-14 h-14 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="text-green-500" size={26} />
              </div>
              <h2 className="text-xl font-black text-foreground mb-1">Email enviado!</h2>
              <p className="text-muted text-sm mb-6">
                Se o email existir em nosso sistema, você receberá um link para redefinir sua senha.
              </p>
              {resetUrl && (
                <div className="mb-6 p-3.5 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-left">
                  <p className="text-[11px] text-yellow-400 mb-1.5 font-bold uppercase tracking-wide">🔧 Modo desenvolvimento</p>
                  <p className="text-xs text-muted mb-2">Link para resetar sua senha:</p>
                  <a href={resetUrl} className="text-xs text-[#ff2d78] break-all hover:underline" target="_blank" rel="noopener noreferrer">{resetUrl}</a>
                </div>
              )}
              <div className="space-y-2.5">
                <Link href="/auth/login" className="block w-full py-3 bg-foreground text-background text-sm font-semibold rounded-full hover:bg-accent hover:text-white transition-colors">
                  Voltar para login
                </Link>
                <button onClick={() => { setSuccess(false); setEmail('') }} className="block w-full py-3 border border-border text-foreground text-sm font-semibold rounded-full hover:bg-surface transition-colors">
                  Tentar outro email
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-3xl border border-border rounded-2xl overflow-hidden flex">
        <BrandPanel />

        {/* Formulário */}
        <div className="flex-1 flex items-center justify-center p-8 lg:p-10 bg-background">
          <div className="w-full max-w-sm">
            {/* Logo mobile */}
            <Link href="/" className="lg:hidden flex items-center gap-2 mb-8 hover:opacity-80 transition-opacity">
              <BrandMark size={24} />
              <span className="text-[15px] font-black tracking-[-0.02em]">Hallyu<span className="text-[#ff2d78]">Hub</span></span>
            </Link>

            <div className="w-11 h-11 bg-[#ff2d78]/10 border border-[#ff2d78]/20 rounded-xl flex items-center justify-center mb-5">
              <KeyRound className="text-[#ff2d78]" size={20} />
            </div>

            <div className="mb-6">
              <h1 className="text-2xl font-black text-foreground">Esqueceu sua senha?</h1>
              <p className="text-muted text-sm mt-1">Digite seu email e enviaremos um link de recuperação.</p>
            </div>

            {error && (
              <div className="mb-5 p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3 text-red-400">
                <AlertCircle size={16} className="shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-[13px] font-semibold text-foreground mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" size={16} />
                  <input
                    id="email" type="email" value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required disabled={isLoading}
                    className="w-full pl-4 pr-10 py-3 text-[14px] border border-border rounded-xl text-foreground bg-background focus:border-accent outline-none transition-colors disabled:opacity-50"
                    placeholder="seu@email.com"
                  />
                </div>
              </div>

              <button
                type="submit" disabled={isLoading}
                className="w-full py-3 bg-foreground text-background text-sm font-semibold rounded-full hover:bg-accent hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isLoading ? <div className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" /> : 'Enviar link de recuperação'}
              </button>
            </form>

            <Link href="/auth/login" className="mt-6 flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors">
              <ArrowLeft size={14} />
              Voltar para login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
