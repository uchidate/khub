'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Lock, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react'

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
      <div className="min-h-screen flex items-center justify-center bg-white px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="border border-[#e8e8e8] rounded-2xl p-8 text-center">
            <div className="w-14 h-14 bg-green-50 border border-green-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="text-green-500" size={28} />
            </div>
            <h2 className="text-2xl font-black text-[#080808] mb-2">Senha Alterada!</h2>
            <p className="text-[#6b6b6b] text-sm mb-4">
              Sua senha foi alterada com sucesso. Redirecionando para login...
            </p>
            <div className="w-6 h-6 border-2 border-[#ff2d78] border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/">
            <span className="text-4xl font-black tracking-[-0.04em] uppercase select-none">
              <span className="text-[#080808]">HALLYU</span>
              <span className="text-[#ff2d78]">HUB</span>
            </span>
          </Link>
        </div>

        {/* Card */}
        <div className="border border-[#e8e8e8] rounded-2xl p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-black text-[#080808]">Nova Senha</h2>
            <p className="text-[#6b6b6b] mt-1 text-sm">Digite sua nova senha abaixo</p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-600">
              <AlertCircle size={16} className="shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-[13px] font-semibold text-[#080808] mb-1.5">
                Nova Senha
              </label>
              <div className="relative">
                <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6b6b6b] pointer-events-none z-10" size={16} />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={!token}
                  className="w-full pl-4 pr-10 py-3 text-[14px] border border-[#e8e8e8] rounded-xl text-[#080808] placeholder:text-[#6b6b6b]/60 focus:border-[#ff2d78] outline-none transition-colors disabled:opacity-50"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-[13px] font-semibold text-[#080808] mb-1.5">
                Confirmar Nova Senha
              </label>
              <div className="relative">
                <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6b6b6b] pointer-events-none z-10" size={16} />
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={!token}
                  className="w-full pl-4 pr-10 py-3 text-[14px] border border-[#e8e8e8] rounded-xl text-[#080808] placeholder:text-[#6b6b6b]/60 focus:border-[#ff2d78] outline-none transition-colors disabled:opacity-50"
                  placeholder="Digite a senha novamente"
                />
              </div>
            </div>

            <div className="text-xs text-[#6b6b6b] space-y-1 py-1">
              <ul className="space-y-1">
                <li className={`flex items-center gap-1.5 ${password.length >= 6 ? 'text-green-600' : ''}`}>
                  <span>{password.length >= 6 ? '✓' : '○'}</span> Pelo menos 6 caracteres
                </li>
                <li className={`flex items-center gap-1.5 ${password === confirmPassword && password ? 'text-green-600' : ''}`}>
                  <span>{password === confirmPassword && password ? '✓' : '○'}</span> Senhas coincidem
                </li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={isLoading || !token}
              className="w-full py-3 bg-[#080808] text-white text-sm font-semibold rounded-full hover:bg-[#ff2d78] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 mt-1"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
            className="mt-6 flex items-center justify-center gap-2 text-sm text-[#6b6b6b] hover:text-[#080808] transition-colors"
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
