'use client'

import { useState, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Mail, Lock, AlertCircle } from 'lucide-react'
import { BrandMark } from '@/components/ui/BrandMark'

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}

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

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/'
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [values, setValues] = useState({ email: '', password: '' })

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      const result = await signIn('credentials', {
        email: values.email,
        password: values.password,
        redirect: false,
      })
      if (result?.error) {
        setError('Email ou senha incorretos')
        return
      }
      router.push(callbackUrl)
      router.refresh()
    } catch {
      setError('Erro ao fazer login. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    try {
      await signIn('google', { callbackUrl })
    } catch {
      setError('Erro ao entrar com Google')
      setIsLoading(false)
    }
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

            <div className="mb-6">
              <h1 className="text-2xl font-black text-foreground">Bem-vindo de volta</h1>
              <p className="text-muted mt-1 text-sm">Entre na sua conta para continuar</p>
            </div>

            {error && (
              <div className="mb-5 p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3 text-red-400">
                <AlertCircle size={16} className="shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            <button
              onClick={handleGoogleSignIn} disabled={isLoading}
              className="w-full mb-5 py-3 bg-background border border-border text-foreground text-sm font-semibold rounded-xl hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2.5"
            >
              <GoogleIcon />
              Continuar com Google
            </button>

            <div className="relative mb-5">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
              <div className="relative flex justify-center">
                <span className="px-3 bg-background text-muted text-xs">ou entre com email</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[13px] font-semibold text-foreground mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" size={16} />
                  <input type="email" value={values.email} onChange={e => setValues(v => ({ ...v, email: e.target.value }))}
                    required disabled={isLoading}
                    className="w-full pl-4 pr-10 py-3 text-[14px] border border-border rounded-xl text-foreground bg-background focus:border-accent outline-none transition-colors disabled:opacity-50"
                    placeholder="seu@email.com" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[13px] font-semibold text-foreground">Senha</label>
                  <Link href="/auth/forgot-password" className="text-xs text-[#ff2d78] hover:underline transition-colors">Esqueceu?</Link>
                </div>
                <div className="relative">
                  <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" size={16} />
                  <input type="password" value={values.password} onChange={e => setValues(v => ({ ...v, password: e.target.value }))}
                    required disabled={isLoading}
                    className="w-full pl-4 pr-10 py-3 text-[14px] border border-border rounded-xl text-foreground bg-background focus:border-accent outline-none transition-colors disabled:opacity-50"
                    placeholder="••••••••" />
                </div>
              </div>

              <button type="submit" disabled={isLoading}
                className="w-full py-3 bg-foreground text-background text-sm font-semibold rounded-full hover:bg-accent hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 mt-1"
              >
                {isLoading ? <div className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" /> : 'Entrar'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-muted">
              Não tem uma conta?{' '}
              <Link href={`/auth/register${callbackUrl !== '/' ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ''}`} className="text-[#ff2d78] hover:underline font-medium transition-colors">
                Criar conta grátis
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
