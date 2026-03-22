'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Lock, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react'

function OrbitalMark() {
  return (
    <svg viewBox="0 0 38 38" fill="none" width={30} height={30}>
      <rect x="5"  y="8" width="6" height="22" rx="3" fill="currentColor"/>
      <rect x="27" y="8" width="6" height="22" rx="3" fill="currentColor"/>
      <path d="M11 19 Q19 13 27 19" stroke="#ff2d78" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <circle cx="19" cy="13.5" r="2.5" fill="#ff2d78"/>
    </svg>
  )
}

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
      <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="border border-border rounded-2xl p-8 text-center bg-background">
            <div className="w-14 h-14 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="text-green-500" size={28} />
            </div>
            <h2 className="text-2xl font-black text-foreground mb-2">Senha Alterada!</h2>
            <p className="text-muted text-sm mb-4">
              Sua senha foi alterada com sucesso. Redirecionando para login...
            </p>
            <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity text-foreground">
            <OrbitalMark />
            <span className="text-xl font-black tracking-[-0.02em] text-foreground">
              Hallyu<span className="text-[#ff2d78]">Hub</span>
            </span>
          </Link>
        </div>

        {/* Card */}
        <div className="border border-border rounded-2xl p-8 bg-background">
          <div className="mb-6">
            <h2 className="text-2xl font-black text-foreground">Nova Senha</h2>
            <p className="text-muted mt-1 text-sm">Digite sua nova senha abaixo</p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3 text-red-400">
              <AlertCircle size={16} className="shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-[13px] font-semibold text-foreground mb-1.5">
                Nova Senha
              </label>
              <div className="relative">
                <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none z-10" size={16} />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={!token}
                  className="w-full pl-4 pr-10 py-3 text-[14px] border border-border rounded-xl text-foreground bg-background focus:border-accent outline-none transition-colors disabled:opacity-50"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-[13px] font-semibold text-foreground mb-1.5">
                Confirmar Nova Senha
              </label>
              <div className="relative">
                <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none z-10" size={16} />
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={!token}
                  className="w-full pl-4 pr-10 py-3 text-[14px] border border-border rounded-xl text-foreground bg-background focus:border-accent outline-none transition-colors disabled:opacity-50"
                  placeholder="Digite a senha novamente"
                />
              </div>
            </div>

            <div className="text-xs text-muted space-y-1 py-1">
              <ul className="space-y-1">
                <li className={`flex items-center gap-1.5 ${password.length >= 6 ? 'text-green-500' : ''}`}>
                  <span>{password.length >= 6 ? '✓' : '○'}</span> Pelo menos 6 caracteres
                </li>
                <li className={`flex items-center gap-1.5 ${password === confirmPassword && password ? 'text-green-500' : ''}`}>
                  <span>{password === confirmPassword && password ? '✓' : '○'}</span> Senhas coincidem
                </li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={isLoading || !token}
              className="w-full py-3 bg-foreground text-background text-sm font-semibold rounded-full hover:bg-accent hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 mt-1"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
              ) : (
                <>
                  <Lock size={16} />
                  Redefinir Senha
                </>
              )}
            </button>
          </form>

          <Link
            href="/auth/login"
            className="mt-6 flex items-center justify-center gap-2 text-sm text-muted hover:text-foreground transition-colors"
          >
            <ArrowLeft size={16} />
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
