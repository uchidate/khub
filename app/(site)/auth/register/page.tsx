'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, Lock, User, AlertCircle, CheckCircle } from 'lucide-react'
import { BrandMark } from '@/components/ui/BrandMark'

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}

function Field({
  id, label, type, name, value, onChange, placeholder,
  icon: Icon, disabled,
}: {
  id: string; label: string; type: string; name: string
  value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder: string; icon: React.ElementType; disabled: boolean
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-[11.5px] font-semibold text-foreground mb-1 uppercase tracking-wide">
        {label}
      </label>
      <div className="relative">
        <Icon className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" size={14} />
        <input
          id={id} name={name} type={type} value={value}
          onChange={onChange} required disabled={disabled}
          className="w-full pl-3.5 pr-9 py-2.5 text-[13px] border border-border rounded-lg text-foreground bg-background focus:border-accent outline-none transition-colors disabled:opacity-50"
          placeholder={placeholder}
        />
      </div>
    </div>
  )
}

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem')
      setIsLoading(false)
      return
    }
    if (formData.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres')
      setIsLoading(false)
      return
    }
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formData.name, email: formData.email, password: formData.password }),
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.error || 'Erro ao criar conta')
        setIsLoading(false)
        return
      }
      setSuccess(true)
      setTimeout(async () => {
        await signIn('credentials', { email: formData.email, password: formData.password, redirect: false })
        router.push('/')
        router.refresh()
      }, 2000)
    } catch {
      setError('Erro ao criar conta. Tente novamente.')
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    try {
      await signIn('google', { callbackUrl: '/' })
    } catch {
      setError('Erro ao entrar com Google')
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-[360px] text-center">
          <div className="border border-border rounded-2xl p-8 bg-background">
            <div className="w-12 h-12 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="text-green-500" size={24} />
            </div>
            <h2 className="text-lg font-black text-foreground mb-1">Conta criada!</h2>
            <p className="text-muted text-sm mb-4">Entrando automaticamente...</p>
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
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-[360px]">

        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-2 mb-6 hover:opacity-80 transition-opacity text-foreground">
          <BrandMark size={26} />
          <span className="text-[15px] font-black tracking-[-0.02em]">
            Hallyu<span className="text-[#ff2d78]">Hub</span>
          </span>
        </Link>

        {/* Card */}
        <div className="border border-border rounded-2xl p-6 bg-background">

          <div className="mb-5">
            <h2 className="text-[1.25rem] font-black text-foreground leading-tight">Criar conta</h2>
            <p className="text-muted text-xs mt-0.5">Grátis. Leva menos de 1 minuto.</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2.5 text-red-400">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <p className="text-xs">{error}</p>
            </div>
          )}

          {/* Google */}
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full mb-4 py-2.5 bg-background border border-border text-foreground text-xs font-semibold rounded-lg hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            <GoogleIcon />
            Continuar com Google
          </button>

          {/* Divider */}
          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-2.5 bg-background text-muted text-[11px]">ou com email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <Field id="name" label="Nome" type="text" name="name"
              value={formData.name} onChange={handleChange}
              placeholder="Seu nome" icon={User} disabled={isLoading} />

            <Field id="email" label="Email" type="email" name="email"
              value={formData.email} onChange={handleChange}
              placeholder="seu@email.com" icon={Mail} disabled={isLoading} />

            {/* Senha + Confirmar em linha */}
            <div className="grid grid-cols-2 gap-2">
              <Field id="password" label="Senha" type="password" name="password"
                value={formData.password} onChange={handleChange}
                placeholder="••••••" icon={Lock} disabled={isLoading} />
              <Field id="confirmPassword" label="Confirmar" type="password" name="confirmPassword"
                value={formData.confirmPassword} onChange={handleChange}
                placeholder="••••••" icon={Lock} disabled={isLoading} />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-foreground text-background text-sm font-semibold rounded-full hover:bg-accent hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 mt-1"
            >
              {isLoading ? (
                <div className="w-3.5 h-3.5 border-2 border-background/30 border-t-background rounded-full animate-spin" />
              ) : (
                'Criar conta'
              )}
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-muted">
            Já tem conta?{' '}
            <Link href="/auth/login" className="text-[#ff2d78] hover:underline font-semibold transition-colors">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
