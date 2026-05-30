'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, Lock, User, CheckCircle } from 'lucide-react'
import { AuthCard, AuthDivider, AuthError, AuthInput, AuthSubmitButton } from '@/components/auth/AuthCard'
import { SocialButtons } from '@/components/auth/SocialButtons'

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    if (formData.password !== formData.confirmPassword) { setError('As senhas não coincidem'); return }
    if (formData.password.length < 6) { setError('A senha deve ter pelo menos 6 caracteres'); return }
    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formData.name, email: formData.email, password: formData.password }),
      })
      const data = await response.json()
      if (!response.ok) { setError(data.error || 'Erro ao criar conta'); setIsLoading(false); return }
      setSuccess(true)
      setTimeout(async () => {
        await signIn('credentials', { email: formData.email, password: formData.password, redirect: false })
        router.push('/'); router.refresh()
      }, 2000)
    } catch {
      setError('Erro ao criar conta. Tente novamente.')
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <AuthCard>
        <div className="text-center py-4">
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
      </AuthCard>
    )
  }

  return (
    <AuthCard>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-foreground">Criar conta</h1>
        <p className="text-muted text-sm mt-0.5">Grátis. Leva menos de 1 minuto.</p>
      </div>

      <AuthError message={error} />

      <SocialButtons callbackUrl="/" disabled={isLoading} onError={setError} />
      <AuthDivider />

      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthInput id="name" label="Nome" type="text" value={formData.name}
          onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
          placeholder="Seu nome" disabled={isLoading} required icon={<User size={16} />} />

        <AuthInput id="reg-email" label="Email" type="email" value={formData.email}
          onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
          placeholder="seu@email.com" disabled={isLoading} required icon={<Mail size={16} />} />

        <AuthInput id="reg-password" label="Senha" type="password" value={formData.password}
          onChange={e => setFormData(p => ({ ...p, password: e.target.value }))}
          placeholder="Mínimo 6 caracteres" disabled={isLoading} required icon={<Lock size={16} />} />

        <div>
          <AuthInput id="confirmPassword" label="Confirmar senha" type="password" value={formData.confirmPassword}
            onChange={e => setFormData(p => ({ ...p, confirmPassword: e.target.value }))}
            placeholder="Digite a senha novamente" disabled={isLoading} required icon={<Lock size={16} />} />
          {formData.password && (
            <p className={`mt-1.5 text-xs flex items-center gap-1.5 ${formData.password === formData.confirmPassword ? 'text-green-500' : 'text-muted'}`}>
              <span>{formData.password === formData.confirmPassword ? '✓' : '○'}</span> Senhas coincidem
            </p>
          )}
        </div>

        <AuthSubmitButton isLoading={isLoading} label="Criar conta" />
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Já tem conta?{' '}
        <Link href="/auth/login" className="text-[#ff2d78] hover:underline font-medium">Entrar</Link>
      </p>
    </AuthCard>
  )
}
