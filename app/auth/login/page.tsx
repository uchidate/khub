'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { LogIn, Mail, Lock, AlertCircle } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { useForm, ValidationRules } from '@/hooks/useForm'
import { motion } from 'framer-motion'

function LoginForm() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm(
    { email: '', password: '' },
    {
      email: [
        ValidationRules.required('Email é obrigatório'),
        ValidationRules.email('Email inválido'),
      ],
      password: [
        ValidationRules.required('Senha é obrigatória'),
        ValidationRules.minLength(6, 'Senha deve ter no mínimo 6 caracteres'),
      ],
    }
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!form.validateAll()) {
      return
    }

    setIsLoading(true)

    try {
      const result = await signIn('credentials', {
        email: form.values.email,
        password: form.values.password,
        redirect: false,
      })

      if (result?.error) {
        setError('Credenciais inválidas')
        return
      }

      router.push('/')
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
      await signIn('google', { callbackUrl: '/' })
    } catch {
      setError('Erro ao fazer login com Google')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-black">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1533174072545-e8d4aa97edf9?q=80&w=2670&auto=format&fit=crop')] bg-cover bg-center opacity-40 blur-sm scale-110 animate-pulse-slow" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md w-full px-4 relative z-10"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-4 group relative">
            <h1 className="text-5xl font-black tracking-tighter uppercase italic select-none">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-purple-600 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]">HALLYU</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-pink-700 drop-shadow-[0_0_15px_rgba(236,72,153,0.5)]">HUB</span>
            </h1>
          </Link>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-zinc-300 font-medium text-lg"
          >
            Sua jornada pelo K-Universe começa aqui.
          </motion.p>
        </div>

        {/* Card */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl shadow-purple-500/10">
          <div className="mb-6 flex justify-center">
            <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center border border-purple-500/30 text-purple-400">
              <LogIn size={24} />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-white text-center mb-6">Bem-vindo de volta!</h2>

          {error && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400"
            >
              <AlertCircle size={20} className="shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Email"
              type="email"
              value={form.values.email}
              onChange={(e) => form.handleChange('email', e.target.value)}
              onBlur={() => form.handleBlur('email')}
              error={form.touched.email ? form.errors.email : undefined}
              placeholder="seu@email.com"
              icon={<Mail size={18} />}
              required
              disabled={isLoading}
              className="bg-black/50 border-white/10 focus:border-purple-500/50"
            />

            <Input
              label="Senha"
              type="password"
              value={form.values.password}
              onChange={(e) => form.handleChange('password', e.target.value)}
              onBlur={() => form.handleBlur('password')}
              error={form.touched.password ? form.errors.password : undefined}
              placeholder="••••••••"
              icon={<Lock size={18} />}
              required
              disabled={isLoading}
              className="bg-black/50 border-white/10 focus:border-purple-500/50"
            />

            <div className="text-right">
              <Link
                href="/auth/forgot-password"
                className="text-xs text-zinc-400 hover:text-white transition-colors hover:underline underline-offset-4"
              >
                Esqueceu a senha?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:from-purple-500 hover:to-pink-500 focus:ring-2 focus:ring-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-purple-900/20 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Entrar'
              )}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/5" />
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-widest">
              <span className="px-4 bg-transparent text-zinc-500 font-bold backdrop-blur-xl">Ou continue com</span>
            </div>
          </div>

          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-3 group"
          >
            <svg className="w-5 h-5 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Google
          </button>

          <p className="mt-8 text-center text-sm text-zinc-400">
            Ainda não é membro?{' '}
            <Link href="/auth/register" className="text-white hover:text-purple-400 font-bold transition-colors underline underline-offset-4">
              Criar conta gratuita
            </Link>
          </p>
        </div>

        <p className="mt-8 text-center text-xs text-zinc-600 font-mono">
          © {new Date().getFullYear()} HallyuHub. Protegido por reCAPTCHA.
        </p>
      </motion.div>
    </div>
  )
}

export default function LoginPage() {
  return <LoginForm />
}
