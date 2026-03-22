'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, Lock, User, AlertCircle, CheckCircle } from 'lucide-react'


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

function FieldInput({
  id,
  label,
  type,
  name,
  value,
  onChange,
  placeholder,
  icon: Icon,
  disabled,
}: {
  id: string
  label: string
  type: string
  name: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder: string
  icon: React.ElementType
  disabled: boolean
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-[13px] font-semibold text-[#080808] mb-1.5">
        {label}
      </label>
      <div className="relative">
        <Icon className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6b6b6b] pointer-events-none z-10" size={16} />
        <input
          id={id}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          required
          disabled={disabled}
          className="w-full pl-4 pr-10 py-3 text-[14px] border border-[#e8e8e8] rounded-xl text-[#080808] placeholder:text-[#6b6b6b]/60 focus:border-[#ff2d78] outline-none transition-colors disabled:opacity-50"
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
      <div className="min-h-screen flex items-center justify-center bg-white px-4">
        <div className="max-w-sm w-full text-center px-6">
          <div className="border border-[#e8e8e8] rounded-2xl p-10">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5 ring-1 ring-green-200">
              <CheckCircle className="text-green-600" size={32} />
            </div>
            <h2 className="text-2xl font-black text-[#080808] mb-2">Conta criada!</h2>
            <p className="text-[#6b6b6b] text-sm mb-6">Entrando automaticamente...</p>
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-[#ff2d78]/30 border-t-[#ff2d78] rounded-full animate-spin" />
              <span className="text-sm text-[#6b6b6b]">Redirecionando</span>
            </div>
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
            <span className="text-4xl font-black tracking-tighter uppercase italic select-none">
              <span className="text-[#080808]">HALLYU</span>
              <span className="text-[#ff2d78]">HUB</span>
            </span>
          </Link>
        </div>

        {/* Card */}
        <div className="border border-[#e8e8e8] rounded-2xl p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-black text-[#080808]">Criar conta</h2>
            <p className="text-[#6b6b6b] mt-1 text-sm">É grátis e leva menos de 1 minuto</p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-600">
              <AlertCircle size={16} className="shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full mb-5 py-3 bg-white border border-[#e8e8e8] text-[#080808] text-sm font-semibold rounded-xl hover:bg-[#f5f5f7] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2.5"
          >
            <GoogleIcon />
            Continuar com Google
          </button>

          <div className="relative mb-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#e8e8e8]" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 bg-white text-[#6b6b6b] text-xs">ou cadastre com email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <FieldInput
              id="name" label="Nome completo" type="text" name="name"
              value={formData.name} onChange={handleChange}
              placeholder="Seu nome" icon={User} disabled={isLoading}
            />
            <FieldInput
              id="email" label="Email" type="email" name="email"
              value={formData.email} onChange={handleChange}
              placeholder="seu@email.com" icon={Mail} disabled={isLoading}
            />
            <FieldInput
              id="password" label="Senha" type="password" name="password"
              value={formData.password} onChange={handleChange}
              placeholder="Mínimo 6 caracteres" icon={Lock} disabled={isLoading}
            />
            <FieldInput
              id="confirmPassword" label="Confirmar senha" type="password" name="confirmPassword"
              value={formData.confirmPassword} onChange={handleChange}
              placeholder="Repita a senha" icon={Lock} disabled={isLoading}
            />

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[#080808] text-white text-sm font-semibold rounded-full hover:bg-[#ff2d78] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 mt-1"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Criar conta'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[#6b6b6b]">
            Já tem uma conta?{' '}
            <Link href="/auth/login" className="text-[#ff2d78] hover:underline font-medium transition-colors">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
