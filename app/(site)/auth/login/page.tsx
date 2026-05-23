'use client'

import { useState, useEffect } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, Lock } from 'lucide-react'
import { AuthCard, AuthDivider, AuthError, AuthInput, AuthSubmitButton } from '@/components/auth/AuthCard'
import { SocialButtons } from '@/components/auth/SocialButtons'

export default function LoginPage() {
  const router = useRouter()
  const [callbackUrl, setCallbackUrl] = useState('/')
  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    setCallbackUrl(p.get('callbackUrl') || '/')
  }, [])

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
      if (result?.error) { setError('Email ou senha incorretos'); return }
      router.push(callbackUrl)
      router.refresh()
    } catch {
      setError('Erro ao fazer login. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthCard>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-foreground">Bem-vindo de volta</h1>
        <p className="text-muted mt-1 text-sm">Entre na sua conta para continuar</p>
      </div>

      <AuthError message={error} />

      <SocialButtons callbackUrl={callbackUrl} disabled={isLoading} onError={setError} />
      <AuthDivider />

      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthInput id="email" label="Email" type="email" value={values.email}
          onChange={e => setValues(v => ({ ...v, email: e.target.value }))}
          placeholder="seu@email.com" disabled={isLoading} required
          icon={<Mail size={16} />} />
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="password" className="text-[13px] font-semibold text-foreground">Senha</label>
            <Link href="/auth/forgot-password" className="text-xs text-[#ff2d78] hover:underline transition-colors">Esqueceu?</Link>
          </div>
          <div className="relative">
            <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" size={16} />
            <input id="password" type="password" value={values.password}
              onChange={e => setValues(v => ({ ...v, password: e.target.value }))}
              required disabled={isLoading} placeholder="••••••••"
              className="w-full pl-4 pr-10 py-3 text-[14px] border border-border rounded-xl text-foreground bg-background focus:border-accent outline-none transition-colors disabled:opacity-50" />
          </div>
        </div>
        <AuthSubmitButton isLoading={isLoading} label="Entrar" />
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Não tem conta?{' '}
        <Link href="/auth/register" className="text-[#ff2d78] hover:underline font-medium">Criar conta grátis</Link>
      </p>
    </AuthCard>
  )
}
