'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, ArrowLeft, AlertCircle, CheckCircle, KeyRound } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [resetUrl, setResetUrl] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
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
        <div className="w-full max-w-sm">
          <div className="border border-border rounded-2xl p-8 bg-surface text-center">
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
                <p className="text-xs text-muted mb-2">Use este link para resetar sua senha:</p>
                <a
                  href={resetUrl}
                  className="text-xs text-[#ff2d78] break-all hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {resetUrl}
                </a>
              </div>
            )}

            <div className="space-y-2.5">
              <Link
                href="/auth/login"
                className="block w-full py-2.5 bg-foreground text-background text-sm font-semibold rounded-full hover:bg-accent hover:text-white transition-colors"
              >
                Voltar para login
              </Link>
              <button
                onClick={() => { setSuccess(false); setEmail('') }}
                className="block w-full py-2.5 border border-border text-foreground text-sm font-semibold rounded-full hover:bg-surface-hover transition-colors"
              >
                Tentar outro email
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Card */}
        <div className="border border-border rounded-2xl p-6 bg-surface">
          {/* Ícone decorativo */}
          <div className="w-11 h-11 bg-[#ff2d78]/10 border border-[#ff2d78]/20 rounded-xl flex items-center justify-center mb-5">
            <KeyRound className="text-[#ff2d78]" size={20} />
          </div>

          <div className="mb-5">
            <h1 className="text-[1.25rem] font-black text-foreground leading-tight">Esqueceu sua senha?</h1>
            <p className="text-muted text-xs mt-1">
              Digite seu email e enviaremos um link de recuperação.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2.5 text-red-400">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <p className="text-xs">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-[11.5px] font-semibold text-foreground mb-1 uppercase tracking-wide">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" size={14} />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="w-full pl-3.5 pr-9 py-2.5 text-[13px] border border-border rounded-lg text-foreground bg-background focus:border-accent outline-none transition-colors disabled:opacity-50"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-foreground text-background text-sm font-semibold rounded-full hover:bg-accent hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-3.5 h-3.5 border-2 border-background/30 border-t-background rounded-full animate-spin" />
              ) : (
                'Enviar link de recuperação'
              )}
            </button>
          </form>

          <Link
            href="/auth/login"
            className="mt-5 flex items-center justify-center gap-1.5 text-xs text-muted hover:text-foreground transition-colors"
          >
            <ArrowLeft size={13} />
            Voltar para login
          </Link>
        </div>
      </div>
    </div>
  )
}
