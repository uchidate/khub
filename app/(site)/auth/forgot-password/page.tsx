'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react'
import { BrandMark } from '@/components/ui/BrandMark'

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
      <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="border border-border rounded-2xl p-8 text-center bg-background">
            <div className="w-14 h-14 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="text-green-500" size={28} />
            </div>
            <h2 className="text-2xl font-black text-foreground mb-2">Email Enviado!</h2>
            <p className="text-muted text-sm mb-6">
              Se o email existir em nosso sistema, você receberá um link para redefinir sua senha.
            </p>

            {resetUrl && (
              <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                <p className="text-xs text-yellow-400 mb-2 font-bold">🔧 MODO DESENVOLVIMENTO</p>
                <p className="text-xs text-muted mb-2">Use este link para resetar sua senha:</p>
                <a
                  href={resetUrl}
                  className="text-xs text-[#ff2d78] break-all"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {resetUrl}
                </a>
              </div>
            )}

            <div className="space-y-3">
              <Link
                href="/auth/login"
                className="block w-full py-3 bg-foreground text-background text-sm font-semibold rounded-full hover:bg-accent hover:text-white transition-colors"
              >
                Voltar para Login
              </Link>
              <button
                onClick={() => { setSuccess(false); setEmail('') }}
                className="block w-full py-3 border border-border text-foreground text-sm font-semibold rounded-full hover:bg-surface transition-colors"
              >
                Enviar Novamente
              </button>
            </div>
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
            <BrandMark size={30} />
            <span className="text-xl font-black tracking-[-0.02em] text-foreground">
              Hallyu<span className="text-[#ff2d78]">Hub</span>
            </span>
          </Link>
        </div>

        {/* Card */}
        <div className="border border-border rounded-2xl p-8 bg-background">
          <div className="mb-6">
            <h2 className="text-2xl font-black text-foreground">Esqueceu sua senha?</h2>
            <p className="text-muted mt-1 text-sm">
              Digite seu email e enviaremos um link para redefinir sua senha
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3 text-red-400">
              <AlertCircle size={16} className="shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-[13px] font-semibold text-foreground mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none z-10" size={16} />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-4 pr-10 py-3 text-[14px] border border-border rounded-xl text-foreground bg-background focus:border-accent outline-none transition-colors"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-foreground text-background text-sm font-semibold rounded-full hover:bg-accent hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 mt-1"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
              ) : (
                <>
                  <Mail size={16} />
                  Enviar Link de Recuperação
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
