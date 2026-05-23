'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Lock, ArrowLeft, ShieldCheck, CheckCircle } from 'lucide-react'
import { AuthCard, AuthError, AuthInput, AuthSubmitButton } from '@/components/auth/AuthCard'

export default function ResetPasswordPage() {
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
    if (password !== confirmPassword) { setError('As senhas não coincidem'); return }
    if (password.length < 6) { setError('A senha deve ter pelo menos 6 caracteres'); return }
    if (!token) { setError('Token inválido'); return }
    setIsLoading(true)
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
      <AuthCard>
        <div className="text-center py-4">
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
      </AuthCard>
    )
  }

  return (
    <AuthCard>
      <div className="w-11 h-11 bg-[#ff2d78]/10 border border-[#ff2d78]/20 rounded-xl flex items-center justify-center mb-5">
        <ShieldCheck className="text-[#ff2d78]" size={20} />
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-black text-foreground">Nova senha</h1>
        <p className="text-muted text-sm mt-1">Digite e confirme sua nova senha abaixo.</p>
      </div>

      <AuthError message={error} />

      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthInput id="password" label="Nova senha" type="password" value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Mínimo 6 caracteres" disabled={!token || isLoading} required icon={<Lock size={16} />} />

        <div>
          <AuthInput id="confirmPassword" label="Confirmar senha" type="password" value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            placeholder="Digite a senha novamente" disabled={!token || isLoading} required icon={<Lock size={16} />} />
          <div className="mt-2 space-y-1 text-xs text-muted">
            <p className={`flex items-center gap-1.5 transition-colors ${password.length >= 6 ? 'text-green-500' : ''}`}>
              <span>{password.length >= 6 ? '✓' : '○'}</span> Pelo menos 6 caracteres
            </p>
            <p className={`flex items-center gap-1.5 transition-colors ${password && password === confirmPassword ? 'text-green-500' : ''}`}>
              <span>{password && password === confirmPassword ? '✓' : '○'}</span> Senhas coincidem
            </p>
          </div>
        </div>

        <AuthSubmitButton isLoading={isLoading} label="Redefinir senha" />
      </form>

      <Link href="/auth/login" className="mt-6 flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors">
        <ArrowLeft size={14} /> Voltar para login
      </Link>
    </AuthCard>
  )
}
