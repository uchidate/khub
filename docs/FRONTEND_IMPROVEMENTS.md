# 🎨 Melhorias no Frontend - HallyuHub

Sugestões de melhorias e novas implementações para o frontend do site.

## 📊 Análise Atual

**Stack Atual:**
- Next.js 14 (App Router)
- Tailwind CSS
- Font: Inter

**Pontos Fortes:**
- ✅ Arquitetura moderna (App Router)
- ✅ SEO configurado (meta tags)
- ✅ Performance (static generation)

**Áreas de Melhoria:**
- ⚠️ Imagens OG ainda apontam para staging
- ⚠️ Sem PWA
- ⚠️ Sem dark mode toggle
- ⚠️ Sem animações/transições
- ⚠️ Sem internacionalização

---

## 🚀 Melhorias Prioritárias

### 1. **Performance & UX**

#### A) Loading States & Skeleton Screens

```tsx
// components/SkeletonCard.tsx
export function SkeletonCard() {
  return (
    <div className="animate-pulse">
      <div className="aspect-[2/3] bg-zinc-800 rounded-lg" />
      <div className="mt-4 h-4 bg-zinc-800 rounded w-3/4" />
      <div className="mt-2 h-3 bg-zinc-800 rounded w-1/2" />
    </div>
  )
}
```

**Benefício**: Melhor percepção de velocidade

#### B) Imagens Otimizadas

```tsx
// Usar next/image em vez de <img>
import Image from 'next/image'

<Image
  src={artist.primaryImageUrl}
  alt={artist.nameRomanized}
  width={400}
  height={600}
  className="object-cover"
  placeholder="blur"
  blurDataURL={artist.blurHash}
/>
```

**Benefício**: -50% tamanho, lazy loading automático

#### C) Infinite Scroll

```tsx
// hooks/useInfiniteScroll.ts
export function useInfiniteScroll(loadMore: () => void) {
  const observerRef = useRef<IntersectionObserver>()

  useEffect(() => {
    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) loadMore()
    })
  }, [])

  return observerRef
}
```

**Benefício**: Melhor UX para listas longas

---

### 2. **Recursos Interativos**

#### A) Busca em Tempo Real

```tsx
// components/SearchBar.tsx
'use client'

import { useState, useEffect } from 'react'
import { useDebounce } from '@/hooks/useDebounce'

export function SearchBar() {
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, 300)
  const [results, setResults] = useState([])

  useEffect(() => {
    if (debouncedQuery) {
      fetch(`/api/search?q=${debouncedQuery}`)
        .then(res => res.json())
        .then(setResults)
    }
  }, [debouncedQuery])

  return (
    <div className="relative">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar artistas, k-dramas..."
        className="w-full px-4 py-2 bg-zinc-900 rounded-lg"
      />

      {results.length > 0 && (
        <SearchResults results={results} />
      )}
    </div>
  )
}
```

**Benefício**: Descoberta de conteúdo mais rápida

#### B) Filtros Dinâmicos

```tsx
// components/FilterBar.tsx
export function FilterBar() {
  const [filters, setFilters] = useState({
    role: 'all',
    agency: 'all',
    sortBy: 'recent'
  })

  return (
    <div className="flex gap-4">
      <select
        value={filters.role}
        onChange={(e) => setFilters({...filters, role: e.target.value})}
        className="px-4 py-2 bg-zinc-900 rounded-lg"
      >
        <option value="all">Todos</option>
        <option value="CANTOR">Cantores</option>
        <option value="ATOR">Atores</option>
        <option value="MODELO">Modelos</option>
      </select>

      <select
        value={filters.sortBy}
        onChange={(e) => setFilters({...filters, sortBy: e.target.value})}
      >
        <option value="recent">Mais recentes</option>
        <option value="popular">Mais populares</option>
        <option value="name">Nome A-Z</option>
      </select>
    </div>
  )
}
```

**Benefício**: Facilita navegação

#### C) Favoritos do Usuário

```tsx
// hooks/useFavorites.ts
export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([])

  useEffect(() => {
    const saved = localStorage.getItem('favorites')
    if (saved) setFavorites(JSON.parse(saved))
  }, [])

  const toggle = (id: string) => {
    const updated = favorites.includes(id)
      ? favorites.filter(f => f !== id)
      : [...favorites, id]

    setFavorites(updated)
    localStorage.setItem('favorites', JSON.stringify(updated))
  }

  return { favorites, toggle, isFavorite: (id: string) => favorites.includes(id) }
}

// components/FavoriteButton.tsx
export function FavoriteButton({ artistId }: { artistId: string }) {
  const { isFavorite, toggle } = useFavorites()

  return (
    <button
      onClick={() => toggle(artistId)}
      className={`p-2 rounded-full ${isFavorite(artistId) ? 'text-red-500' : 'text-gray-400'}`}
    >
      <Heart fill={isFavorite(artistId) ? 'currentColor' : 'none'} />
    </button>
  )
}
```

**Benefício**: Personalização

---

### 3. **Animações & Micro-interações**

#### A) Framer Motion

```bash
npm install framer-motion
```

```tsx
// components/ArtistCard.tsx
import { motion } from 'framer-motion'

export function ArtistCard({ artist, index }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* Conteúdo do card */}
    </motion.div>
  )
}
```

**Benefício**: UX mais fluida e profissional

#### B) Page Transitions

```tsx
// components/PageTransition.tsx
import { motion, AnimatePresence } from 'framer-motion'

export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        transition={{ duration: 0.3 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
```

**Benefício**: Navegação mais suave

---

### 4. **Dark Mode Toggle**

```tsx
// components/ThemeToggle.tsx
'use client'

import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700"
    >
      {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  )
}
```

```tsx
// app/layout.tsx
import { ThemeProvider } from 'next-themes'

export default function RootLayout({ children }: Props) {
  return (
    <html suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="dark">
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
```

**Benefício**: Acessibilidade + preferência do usuário

---

### 5. **PWA (Progressive Web App)**

```bash
npm install next-pwa
```

```js
// next.config.js
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
})

module.exports = withPWA({
  // ...config
})
```

```json
// public/manifest.json
{
  "name": "HallyuHub",
  "short_name": "HallyuHub",
  "description": "Portal da Onda Coreana",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#000000",
  "theme_color": "#a855f7",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

**Benefício**: Instalável, funciona offline, notificações push

---

### 6. **Componentes Avançados**

#### A) Carrossel

```tsx
// components/Carousel.tsx
'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export function Carousel({ items }: { items: any[] }) {
  const [currentIndex, setCurrentIndex] = useState(0)

  const next = () => setCurrentIndex((i) => (i + 1) % items.length)
  const prev = () => setCurrentIndex((i) => (i - 1 + items.length) % items.length)

  return (
    <div className="relative">
      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-300"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {items.map((item, i) => (
            <div key={i} className="min-w-full">
              {item}
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={prev}
        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 rounded-full"
      >
        <ChevronLeft />
      </button>

      <button
        onClick={next}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 rounded-full"
      >
        <ChevronRight />
      </button>
    </div>
  )
}
```

**Benefício**: Destaque de conteúdo featured

#### B) Modal/Dialog

```tsx
// components/Modal.tsx
'use client'

import { X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export function Modal({ isOpen, onClose, children }: Props) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 z-50"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-zinc-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center p-4 border-b border-zinc-800">
                <h2 className="text-xl font-bold">Detalhes</h2>
                <button onClick={onClose}>
                  <X />
                </button>
              </div>

              <div className="p-4">
                {children}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
```

**Benefício**: Detalhes sem sair da página

#### C) Toast Notifications

```tsx
// lib/toast.tsx
import { toast } from 'sonner'

// Instalar: npm install sonner

// app/layout.tsx
import { Toaster } from 'sonner'

export default function RootLayout({ children }: Props) {
  return (
    <html>
      <body>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}

// Uso:
toast.success('Adicionado aos favoritos!')
toast.error('Erro ao carregar')
toast.loading('Carregando...')
```

**Benefício**: Feedback imediato de ações

---

### 7. **SEO & Analytics**

#### A) Sitemap Dinâmico

```ts
// app/sitemap.ts
import { MetadataRoute } from 'next'
import prisma from '@/lib/prisma'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const artists = await prisma.artist.findMany({
    select: { id: true, updatedAt: true }
  })

  const productions = await prisma.production.findMany({
    select: { id: true, updatedAt: true }
  })

  return [
    {
      url: 'https://www.hallyuhub.com.br',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    ...artists.map(a => ({
      url: `https://www.hallyuhub.com.br/v1/artists/${a.id}`,
      lastModified: a.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    ...productions.map(p => ({
      url: `https://www.hallyuhub.com.br/v1/productions/${p.id}`,
      lastModified: p.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
  ]
}
```

**Benefício**: Melhor indexação Google

#### B) Google Analytics 4

```tsx
// components/Analytics.tsx
import Script from 'next/script'

export function Analytics() {
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-XXXXXXXXXX');
        `}
      </Script>
    </>
  )
}
```

**Benefício**: Métricas de uso

---

### 8. **Social Features**

#### A) Share Buttons

```tsx
// components/ShareButton.tsx
export function ShareButton({ title, url }: Props) {
  const share = () => {
    if (navigator.share) {
      navigator.share({ title, url })
    } else {
      // Fallback: copiar URL
      navigator.clipboard.writeText(url)
      toast.success('Link copiado!')
    }
  }

  return (
    <button onClick={share} className="flex items-center gap-2">
      <Share2 size={16} />
      Compartilhar
    </button>
  )
}
```

**Benefício**: Viralização

#### B) Comentários (Disqus/Giscus)

```tsx
// components/Comments.tsx
import Giscus from '@giscus/react'

export function Comments({ identifier }: { identifier: string }) {
  return (
    <Giscus
      repo="uchidate/khub"
      repoId="..."
      category="Comments"
      categoryId="..."
      mapping="specific"
      term={identifier}
      reactionsEnabled="1"
      emitMetadata="0"
      theme="dark"
      lang="pt"
    />
  )
}
```

**Benefício**: Engajamento

---

## 🎯 Roadmap de Implementação

### Fase 1: Quick Wins (1 semana)
1. ✅ Imagens otimizadas (next/image)
2. ✅ Loading skeletons
3. ✅ Busca básica
4. ✅ Favoritos localStorage

### Fase 2: UX (2 semanas)
1. ✅ Dark mode toggle
2. ✅ Animações Framer Motion
3. ✅ Filtros dinâmicos
4. ✅ Infinite scroll

### Fase 3: Features (2 semanas)
1. ✅ PWA
2. ✅ Carrossel
3. ✅ Modal
4. ✅ Toast notifications

### Fase 4: Advanced (1 semana)
1. ✅ Sitemap dinâmico
2. ✅ Analytics
3. ✅ Share buttons
4. ✅ Comentários

---

## 💰 Estimativa de Impacto

| Melhoria | Esforço | Impacto | ROI |
|----------|---------|---------|-----|
| Imagens otimizadas | Baixo | Alto | ⭐⭐⭐⭐⭐ |
| Loading skeletons | Baixo | Médio | ⭐⭐⭐⭐ |
| Busca em tempo real | Médio | Alto | ⭐⭐⭐⭐⭐ |
| Dark mode | Baixo | Médio | ⭐⭐⭐⭐ |
| Animações | Médio | Médio | ⭐⭐⭐ |
| PWA | Alto | Alto | ⭐⭐⭐⭐⭐ |
| Favoritos | Baixo | Médio | ⭐⭐⭐⭐ |
| Analytics | Baixo | Alto | ⭐⭐⭐⭐⭐ |

---

## 🚀 Como Começar

### 1. Instalar Dependências

```bash
npm install framer-motion next-themes sonner @giscus/react next-pwa
```

### 2. Criar Estrutura

```bash
mkdir -p components/{ui,features}
mkdir -p hooks
mkdir -p lib/analytics
```

### 3. Implementar Gradualmente

Comece com os "Quick Wins" e vá adicionando features incrementalmente.

---

**Resultado Esperado**: Site moderno, performático e engajador! 🚀
