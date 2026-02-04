'use client'

import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'

export function PWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showInstallBanner, setShowInstallBanner] = useState(false)

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch((err) => {
          console.log('Service Worker registration failed:', err)
        })
      })
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)

      // Check if user has dismissed before
      const dismissed = localStorage.getItem('hallyuhub_pwa_dismissed')
      if (!dismissed) {
        setShowInstallBanner(true)
      }
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      console.log('User accepted PWA install')
    }

    setDeferredPrompt(null)
    setShowInstallBanner(false)
  }

  const handleDismiss = () => {
    setShowInstallBanner(false)
    localStorage.setItem('hallyuhub_pwa_dismissed', 'true')
  }

  if (!showInstallBanner) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 animate-slide-up">
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl shadow-2xl p-6 relative">
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-white/80 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex items-start gap-4">
          <div className="bg-white/20 rounded-xl p-3">
            <Download size={24} className="text-white" />
          </div>

          <div className="flex-1">
            <h3 className="text-white font-black text-lg mb-1">Instalar HallyuHub</h3>
            <p className="text-white/90 text-sm mb-4">
              Acesse o app diretamente da sua tela inicial e funcione offline!
            </p>

            <button
              onClick={handleInstallClick}
              className="w-full bg-white text-purple-600 font-bold py-2 px-4 rounded-lg hover:bg-zinc-100 transition-colors"
            >
              Instalar Agora
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
