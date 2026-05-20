'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Lock, AlertCircle, CheckCircle, ArrowLeft, ShieldCheck } from 'lucide-react'
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
        <p className="text-sm text-muted">Perfis de artistas, grupos, doramas e filmes — tudo em português.</p>
      </div>

      <div className="relative z-10 flex items-center gap-2 text-xs text-muted">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
        hallyuhub.com.br
      </div>
    </div>
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
    const params = new URLSearchParams(window.location.search)
    const urlToken = params.get('token')
    if (!urlToken) setError('Token inválido ou ausente')
    else setToken(urlToken)
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    if (password !== confirmPassword) { setError('As senhas não coincidem'); setIsLoading(false); return }
    if (password.length < 6) { setError('A senha deve ter pelo menos 6 caracteres'); setIsLoading(false); return }
    if (!token) { setError('Token inválido'); setIsLoading(false); return }
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await response.json()
      if (!response.ok) { setError(data.error || 'Erro ao resetar senha'); setIsLoading(false); return }
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
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-3xl border border-border rounded-2xl overflow-hidden flex">
          <BrandPanel />
          <div className="flex-1 flex items-center justify-center p-10 bg-background text-center">
            <div>
              <div className="w-14 h-14 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="text-green-500" size={26} />
              </div>
              <h2 className="text-xl font-black text-foreground mb-1">Senha alterada!</h2>
              <p className="text-muted text-sm mb-5">Sua senha foi redefinida. Redirecionando para login...</p>
              <div className="flex items-center justify-center gap-2">
                <div className="w-3.5 h-3.5 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
                <span className="text-xs text-muted">Redirecionando</span>
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

        <div className="flex-1 flex items-center justify-center p-8 lg:p-10 bg-background">
          <div className="w-full max-w-sm">
            <Link href="/" className="lg:hidden flex items-center gap-2 mb-8 hover:opacity-80 transition-opacity">
              <BrandMark size={24} />
              <span className="text-[15px] font-black tracking-[-0.02em]">Hallyu<span className="text-[#ff2d78]">Hub</span></span>
            </Link>

            <div className="w-11 h-11 bg-[#ff2d78]/10 border border-[#ff2d78]/20 rounded-xl flex items-center justify-center mb-5">
              <ShieldCheck className="text-[#ff2d78]" size={20} />
            </div>

            <div className="mb-6">
              <h1 className="text-2xl font-black text-foreground">Nova senha</h1>
              <p className="text-muted text-sm mt-1">Digite e confirme sua nova senha abaixo.</p>
            </div>

            {error && (
              <div className="mb-5 p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3 text-red-400">
                <AlertCircle size={16} className="shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-[13px] font-semibold text-foreground mb-1.5">Nova senha</label>
                <div className="relative">
                  <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" size={16} />
                  <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                    required disabled={!token || isLoading}
                    className="w-full pl-4 pr-10 py-3 text-[14px] border border-border rounded-xl text-foreground bg-background focus:border-accent outline-none transition-colors disabled:opacity-50"
                    placeholder="Mínimo 6 caracteres" />
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-[13px] font-semibold text-foreground mb-1.5">Confirmar senha</label>
                <div className="relative">
                  <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" size={16} />
                  <input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                    required disabled={!token || isLoading}
                    className="w-full pl-4 pr-10 py-3 text-[14px] border border-border rounded-xl text-foreground bg-background focus:border-accent outline-none transition-colors disabled:opacity-50"
                    placeholder="Digite a senha novamente" />
                </div>
              </div>

              <div className="text-xs text-muted space-y-1 py-0.5">
                <div className={`flex items-center gap-1.5 transition-colors ${password.length >= 6 ? 'text-green-500' : ''}`}>
                  <span>{password.length >= 6 ? '✓' : '○'}</span> Pelo menos 6 caracteres
                </div>
                <div className={`flex items-center gap-1.5 transition-colors ${password && password === confirmPassword ? 'text-green-500' : ''}`}>
                  <span>{password && password === confirmPassword ? '✓' : '○'}</span> Senhas coincidem
                </div>
              </div>

              <button type="submit" disabled={isLoading || !token}
                className="w-full py-3 bg-foreground text-background text-sm font-semibold rounded-full hover:bg-accent hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isLoading ? <div className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" /> : 'Redefinir senha'}
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

export default function ResetPasswordPage() {
  return <ResetPasswordForm />
}
