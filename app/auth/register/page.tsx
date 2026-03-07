'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, Lock, User, AlertCircle, CheckCircle, Star, Music, Globe } from 'lucide-react'
import { motion } from 'framer-motion'

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

const features = [
  { icon: Star,  text: 'Acompanhe seus artistas favoritos' },
  { icon: Music, text: 'Explore discografias completas' },
  { icon: Globe, text: 'Comunidade de fãs brasileiros' },
]

function BrandPanel() {
  return (
    <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative overflow-hidden flex-col justify-center p-16">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-950 via-black to-pink-950" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_20%_20%,rgba(168,85,247,0.18),transparent)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_80%_80%,rgba(236,72,153,0.12),transparent)]" />
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <div className="relative z-10 max-w-sm">
        <Link href="/" className="inline-block mb-14">
          <span className="text-6xl font-black tracking-tighter uppercase italic select-none">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-purple-500">HALLYU</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-pink-500">HUB</span>
          </span>
        </Link>

        <h2 className="text-3xl font-bold text-white mb-3 leading-tight">
          Junte-se à maior comunidade<br />
          <span className="text-purple-400">K-Pop</span> do Brasil
        </h2>
        <p className="text-zinc-400 mb-10 leading-relaxed">
          Crie sua conta gratuita e comece a explorar o universo hallyu.
        </p>

        <ul className="space-y-3">
          {features.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-3 text-zinc-300">
              <span className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                <Icon size={15} className="text-purple-400" />
              </span>
              <span className="text-sm">{text}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
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
      <label htmlFor={id} className="block text-sm font-medium text-zinc-300 mb-1.5">
        {label}
      </label>
      <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-xl focus-within:border-purple-500/60 focus-within:ring-1 focus-within:ring-purple-500/20 transition-all">
        <span className="pl-3.5 text-zinc-500 shrink-0"><Icon size={16} /></span>
        <input
          id={id}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          required
          disabled={disabled}
          className="flex-1 px-3 py-2.5 text-sm bg-transparent border-0 text-white placeholder:text-zinc-600 focus:outline-none disabled:opacity-50"
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
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-950/40 via-black to-black" />
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative z-10 max-w-sm w-full text-center px-6"
        >
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-10">
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-5 ring-1 ring-green-500/30">
              <CheckCircle className="text-green-400" size={32} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Conta criada!</h2>
            <p className="text-zinc-400 text-sm mb-6">Entrando automaticamente...</p>
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-purple-500/40 border-t-purple-400 rounded-full animate-spin" />
              <span className="text-sm text-zinc-500">Redirecionando</span>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex bg-black">
      <BrandPanel />

      <div className="w-full lg:w-1/2 xl:w-2/5 flex items-center justify-center p-6 sm:p-12 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-sm py-8"
        >
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-10">
            <Link href="/">
              <span className="text-4xl font-black tracking-tighter uppercase italic select-none">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-purple-500">HALLYU</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-pink-500">HUB</span>
              </span>
            </Link>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white">Criar conta</h2>
            <p className="text-zinc-500 mt-1 text-sm">É grátis e leva menos de 1 minuto</p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400"
            >
              <AlertCircle size={16} className="shrink-0" />
              <p className="text-sm">{error}</p>
            </motion.div>
          )}

          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full mb-5 py-2.5 bg-zinc-900 border border-zinc-700 text-white text-sm font-medium rounded-xl hover:bg-zinc-800 hover:border-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2.5"
          >
            <GoogleIcon />
            Continuar com Google
          </button>

          <div className="relative mb-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-800" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 bg-black text-zinc-600 text-xs">ou cadastre com email</span>
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
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 mt-1"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Criar conta'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-zinc-500">
            Já tem uma conta?{' '}
            <Link href="/auth/login" className="text-purple-400 hover:text-purple-300 font-medium transition-colors">
              Entrar
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
