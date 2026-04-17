'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { X, Heart, MessageCircle, Star, Lock } from 'lucide-react'
import { useAuthGate } from '@/lib/hooks/useAuthGate'

export function AuthGateModal() {
  const { isOpen, action, close } = useAuthGate()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!mounted || !isOpen) return null

  const callbackUrl = typeof window !== 'undefined'
    ? window.location.pathname + window.location.search
    : '/'

  const handleLogin = () => {
    close()
    router.push(`/auth/login?callbackUrl=${encodeURIComponent(callbackUrl)}`)
  }

  const handleRegister = () => {
    close()
    router.push(`/auth/register?callbackUrl=${encodeURIComponent(callbackUrl)}`)
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[350] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={close}
    >
      <div
        className="relative w-full max-w-sm bg-background border border-border rounded-2xl shadow-2xl shadow-black/10 p-6"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={close}
          className="absolute top-4 right-4 text-muted hover:text-foreground transition-colors"
          aria-label="Fechar"
        >
          <X size={18} />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-full bg-[#ff2d78]/10 border border-[#ff2d78]/20 flex items-center justify-center">
            <Lock size={24} className="text-[#ff2d78]" />
          </div>
        </div>

        {/* Heading */}
        <div className="text-center mb-5">
          <h2 className="text-lg font-black text-foreground mb-1">Faça parte da comunidade</h2>
          <p className="text-sm text-muted">
            Para <span className="text-foreground font-semibold">{action}</span>, você precisa ter uma conta HallyuHub.
          </p>
        </div>

        {/* Benefits */}
        <ul className="space-y-2 mb-6">
          <li className="flex items-center gap-3 text-sm text-muted">
            <Heart size={14} className="text-red-400 shrink-0" />
            Salve seus artistas e produções favoritos
          </li>
          <li className="flex items-center gap-3 text-sm text-muted">
            <MessageCircle size={14} className="text-[#ff2d78] shrink-0" />
            Participe das discussões e comente
          </li>
          <li className="flex items-center gap-3 text-sm text-muted">
            <Star size={14} className="text-yellow-400 shrink-0" />
            Ajude a melhorar o conteúdo do site
          </li>
        </ul>

        {/* CTAs */}
        <div className="flex flex-col gap-2">
          <button
            onClick={handleRegister}
            className="w-full py-2.5 bg-[#ff2d78] text-white text-sm font-bold rounded-lg hover:opacity-90 transition-opacity"
          >
            Criar conta grátis
          </button>
          <button
            onClick={handleLogin}
            className="w-full py-2.5 bg-surface hover:bg-[#e8e8e8] text-foreground text-sm font-bold rounded-lg transition-colors border border-border"
          >
            Já tenho conta — Entrar
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
