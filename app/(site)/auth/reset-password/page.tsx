'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Lock, AlertCircle, CheckCircle, ArrowLeft, ShieldCheck } from 'lucide-react'

function ResetPasswordForm() {
  const router = useRouter()
  const [token, setToken] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const urlToken = params.get('token')
      if (!urlToken) {
        setError('Token inválido ou ausente')
      } else {
        setToken(urlToken)
      }
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    if (password !== confirmPassword) {
      setError('As senhas não coincidem')
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres')
      setIsLoading(false)
      return
    }

    if (!token) {
      setError('Token inválido')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Erro ao resetar senha')
        setIsLoading(false)
        return
      }

      setSuccess(true)
      setTimeout(() => router.push('/auth/login'), 3000)
    } catch {
      setError('Erro ao redefinir senha. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="px-4 py-16 flex items-center justify-center">
        <div className="w-full max-w-sm">
          <div className="border border-border rounded-2xl p-8 bg-surface text-center">
            <div className="w-14 h-14 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="text-green-500" size={26} />
            </div>
            <h2 className="text-xl font-black text-foreground mb-1">Senha alterada!</h2>
            <p className="text-muted text-sm mb-5">
              Sua senha foi redefinida com sucesso. Redirecionando para login...
            </p>
            <div className="flex items-center justify-center gap-2">
              <div className="w-3.5 h-3.5 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
              <span className="text-xs text-muted">Redirecionando</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-16 flex items-center justify-center">
      <div className="w-full max-w-sm">
        {/* Card */}
        <div className="border border-border rounded-2xl p-6 bg-surface">
          {/* Ícone decorativo */}
          <div className="w-11 h-11 bg-[#ff2d78]/10 border border-[#ff2d78]/20 rounded-xl flex items-center justify-center mb-5">
            <ShieldCheck className="text-[#ff2d78]" size={20} />
          </div>

          <div className="mb-5">
            <h1 className="text-[1.25rem] font-black text-foreground leading-tight">Nova senha</h1>
            <p className="text-muted text-xs mt-1">
              Digite e confirme sua nova senha abaixo.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2.5 text-red-400">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <p className="text-xs">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label htmlFor="password" className="block text-[11.5px] font-semibold text-foreground mb-1 uppercase tracking-wide">
                Nova senha
              </label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" size={14} />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={!token || isLoading}
                  className="w-full pl-3.5 pr-9 py-2.5 text-[13px] border border-border rounded-lg text-foreground bg-background focus:border-accent outline-none transition-colors disabled:opacity-50"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-[11.5px] font-semibold text-foreground mb-1 uppercase tracking-wide">
                Confirmar senha
              </label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" size={14} />
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={!token || isLoading}
                  className="w-full pl-3.5 pr-9 py-2.5 text-[13px] border border-border rounded-lg text-foreground bg-background focus:border-accent outline-none transition-colors disabled:opacity-50"
                  placeholder="Digite a senha novamente"
                />
              </div>
            </div>

            {/* Indicadores */}
            <div className="text-[11px] text-muted space-y-1 py-0.5">
              <div className={`flex items-center gap-1.5 transition-colors ${password.length >= 6 ? 'text-green-500' : ''}`}>
                <span>{password.length >= 6 ? '✓' : '○'}</span> Pelo menos 6 caracteres
              </div>
              <div className={`flex items-center gap-1.5 transition-colors ${password && password === confirmPassword ? 'text-green-500' : ''}`}>
                <span>{password && password === confirmPassword ? '✓' : '○'}</span> Senhas coincidem
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !token}
              className="w-full py-2.5 bg-foreground text-background text-sm font-semibold rounded-full hover:bg-accent hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 mt-1"
            >
              {isLoading ? (
                <div className="w-3.5 h-3.5 border-2 border-background/30 border-t-background rounded-full animate-spin" />
              ) : (
                'Redefinir senha'
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

export default function ResetPasswordPage() {
  return <ResetPasswordForm />
}
