# 📊 Proposta de Melhorias - HallyuHub

## Visão Geral

Este documento apresenta melhorias em 4 áreas críticas do HallyuHub:
1. **Notificações** - Mais informações e feedback em tempo real
2. **UI Experience** - Interações mais fluidas e feedback visual
3. **Responsividade Mobile** - Correção de problemas identificados
4. **Artistas em Destaque** - Sistema mais dinâmico e interativo

---

## 1. 🔔 Notificações com Mais Informações

### Estado Atual

**Slack Notifications:**
- 3 canais: `notifications`, `content-updates`, `alerts`
- Tipos: `notifyContentAdded()`, `notifyAlert()`, `notifyActivity()`
- Informações básicas sem contexto completo

**Frontend:**
- Componente `Toast.tsx` existente mas pouco utilizado
- 4 tipos: success, error, info, warning
- Notificações inline em páginas de auth apenas

### Problemas Identificados

1. **Falta feedback visual para ações do usuário**
   - Login/logout silencioso
   - Favoritar artista sem confirmação visual
   - Ações admin sem indicador de sucesso/falha

2. **Slack com informações incompletas**
   - Falta timestamp detalhado
   - Sem link direto para entidade criada
   - Sem identificação de quem realizou a ação

3. **Ausência de notificações persistentes**
   - Não há histórico de notificações
   - Usuário não pode revisar ações passadas

### Solução Proposta

#### A. Frontend Toast Notifications (Prioridade: ALTA)

**Implementar em:**
- Login/logout
- Favoritar/desfavoritar
- Ações admin (criar, editar, deletar)
- Operações assíncronas (filmography sync)

**Exemplo de implementação:**

```typescript
// lib/hooks/useToast.ts (NEW)
'use client'

import { create } from 'zustand'

type ToastType = 'success' | 'error' | 'info' | 'warning'

interface Toast {
  id: string
  type: ToastType
  message: string
  duration?: number
}

interface ToastStore {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
}

export const useToast = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = Math.random().toString(36).slice(2, 9)
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }]
    }))

    // Auto-remove after duration
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id)
      }))
    }, toast.duration || 5000)
  },
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id)
    }))
  }
}))
```

**Uso:**

```tsx
// app/v1/artists/[id]/page.tsx
'use client'

import { useToast } from '@/lib/hooks/useToast'

export default function ArtistPage() {
  const { addToast } = useToast()

  const handleFavorite = async () => {
    try {
      await fetch('/api/favorites', { method: 'POST', body: JSON.stringify({ artistId }) })
      addToast({
        type: 'success',
        message: '⭐ Artista adicionado aos favoritos!'
      })
    } catch (error) {
      addToast({
        type: 'error',
        message: '❌ Erro ao favoritar artista'
      })
    }
  }

  return (/* ... */)
}
```

**ToastContainer global:**

```tsx
// components/features/ToastContainer.tsx (NEW)
'use client'

import { useToast } from '@/lib/hooks/useToast'
import { Toast } from '@/components/ui/Toast'

export function ToastContainer() {
  const { toasts, removeToast } = useToast()

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          type={toast.type}
          message={toast.message}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  )
}
```

Adicionar em `app/v1/layout.tsx`:
```tsx
import { ToastContainer } from '@/components/features/ToastContainer'

export default function SiteLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-grow">{children}</main>
      <ToastContainer /> {/* ADD THIS */}
      <PWAInstaller />
      <footer>...</footer>
    </div>
  )
}
```

#### B. Slack Notifications Aprimoradas (Prioridade: MÉDIA)

**Adicionar informações:**

```typescript
// lib/services/slack-notification-service.ts (MODIFY)

async notifyContentAdded(data: {
  type: ContentType
  name: string
  details: Record<string, string>
  userId?: string  // NEW
  userEmail?: string  // NEW
  url?: string  // NEW: Link direto para entidade
}) {
  const blocks = [
    {
      type: 'header',
      text: { type: 'plain_text', text: `✨ Novo Conteúdo: ${this.formatType(data.type)}` }
    },
    {
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: `*Nome:*\n${data.name}` },
        { type: 'mrkdwn', text: `*Tipo:*\n${data.type}` },
        // NEW: User info
        ...(data.userEmail ? [
          { type: 'mrkdwn', text: `*Criado por:*\n${data.userEmail}` }
        ] : []),
        // NEW: Timestamp
        { type: 'mrkdwn', text: `*Quando:*\n${new Date().toLocaleString('pt-BR')}` }
      ]
    },
    // NEW: Direct link
    ...(data.url ? [{
      type: 'actions',
      elements: [{
        type: 'button',
        text: { type: 'plain_text', text: '🔗 Ver no Site' },
        url: data.url
      }]
    }] : []),
    // ... rest of blocks
  ]

  await this.sendToChannel('content-updates', { blocks })
}
```

**Uso atualizado:**

```typescript
// lib/ai/generators/artist-generator.ts
await slackService.notifyContentAdded({
  type: 'artist',
  name: artist.nameRomanized,
  details: { /* ... */ },
  userId: session?.user?.id,  // NEW
  userEmail: session?.user?.email,  // NEW
  url: `https://www.hallyuhub.com.br/v1/artists/${savedArtist.id}`  // NEW
})
```

#### C. Sistema de Notificações Persistentes (Prioridade: BAIXA)

**Nova tabela:**

```prisma
// prisma/schema.prisma (ADD)

model Notification {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  type      String   // 'info', 'success', 'warning', 'error'
  title     String
  message   String
  read      Boolean  @default(false)

  relatedType  String?  // 'artist', 'production', 'news', etc.
  relatedId    String?  // ID da entidade relacionada

  createdAt DateTime @default(now())

  @@index([userId, read])
  @@index([createdAt])
}
```

**API:**

```typescript
// app/api/notifications/route.ts (NEW)
export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const unread = await prisma.notification.count({
    where: { userId: session.user.id, read: false }
  })

  const recent = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 10
  })

  return NextResponse.json({ unread, recent })
}
```

**UI no NavBar:**

```tsx
// components/NavBar.tsx (MODIFY)
<Link href="/notifications" className="relative">
  <Bell className="w-6 h-6" />
  {unreadCount > 0 && (
    <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
      {unreadCount}
    </span>
  )}
</Link>
```

---

## 2. 🎨 UI Experience

### Estado Atual

- Transições básicas com Tailwind (`transition-colors`, `hover:scale-105`)
- Animações definidas em `styles/globals.css`: fade-in, slide-up, shimmer, gradient-shift
- Poucos estados de loading
- Erros genéricos sem detalhes

### Problemas Identificados

1. **Ausência de feedback visual em ações**
   - Botões sem loading state
   - Formulários sem indicador de envio
   - Páginas sem skeleton screens

2. **Navegação sem transições suaves**
   - Mudanças de página abruptas
   - Sem indicador de progresso

3. **Erros sem contexto**
   - Mensagens genéricas: "Erro ao carregar"
   - Sem sugestões de recuperação

### Solução Proposta

#### A. Loading States Consistentes (Prioridade: ALTA)

**Button component com loading:**

```tsx
// components/ui/Button.tsx (NEW)
import { Loader2 } from 'lucide-react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline'
  loading?: boolean
  children: React.ReactNode
}

export function Button({ variant = 'primary', loading, children, disabled, ...props }: ButtonProps) {
  const baseClass = 'px-4 py-2 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed'
  const variantClass = {
    primary: 'bg-purple-600 hover:bg-purple-700 text-white',
    secondary: 'bg-zinc-800 hover:bg-zinc-700 text-white',
    outline: 'border-2 border-purple-600 hover:bg-purple-600/10 text-purple-500'
  }[variant]

  return (
    <button
      className={`${baseClass} ${variantClass}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Carregando...
        </span>
      ) : children}
    </button>
  )
}
```

**Uso:**

```tsx
const [loading, setLoading] = useState(false)

<Button
  variant="primary"
  loading={loading}
  onClick={async () => {
    setLoading(true)
    await handleSubmit()
    setLoading(false)
  }}
>
  Salvar
</Button>
```

#### B. Skeleton Screens (Prioridade: ALTA)

```tsx
// components/ui/Skeleton.tsx (NEW)
export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-zinc-800 rounded ${className}`} />
  )
}

// components/skeletons/ArtistCardSkeleton.tsx (NEW)
export function ArtistCardSkeleton() {
  return (
    <div className="card-hover">
      <div className="aspect-[3/4] rounded-lg overflow-hidden bg-zinc-900 border border-white/5">
        <Skeleton className="w-full h-full" />
      </div>
      <Skeleton className="h-4 w-3/4 mt-2" />
      <Skeleton className="h-3 w-1/2 mt-1" />
    </div>
  )
}
```

**Uso em páginas:**

```tsx
// app/v1/artists/page.tsx
export default async function ArtistsPage() {
  return (
    <Suspense fallback={
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <ArtistCardSkeleton key={i} />
        ))}
      </div>
    }>
      <ArtistsGrid />
    </Suspense>
  )
}
```

#### C. Mensagens de Erro Úteis (Prioridade: MÉDIA)

```tsx
// components/ui/ErrorMessage.tsx (NEW)
interface ErrorMessageProps {
  title: string
  message: string
  retry?: () => void
  showSupport?: boolean
}

export function ErrorMessage({ title, message, retry, showSupport }: ErrorMessageProps) {
  return (
    <div className="bg-red-900/20 border border-red-700 rounded-lg p-6 text-center max-w-md mx-auto">
      <div className="text-red-500 mb-4">
        <AlertCircle className="w-12 h-12 mx-auto" />
      </div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-zinc-400 mb-4">{message}</p>
      <div className="flex gap-3 justify-center">
        {retry && (
          <Button onClick={retry} variant="primary">
            🔄 Tentar Novamente
          </Button>
        )}
        {showSupport && (
          <Button onClick={() => window.open('mailto:suporte@hallyuhub.com.br')} variant="outline">
            📧 Contatar Suporte
          </Button>
        )}
      </div>
    </div>
  )
}
```

**Uso:**

```tsx
// app/v1/artists/[id]/page.tsx
if (!artist) {
  return (
    <ErrorMessage
      title="Artista não encontrado"
      message="Este artista pode ter sido removido ou o link está incorreto."
      retry={() => router.refresh()}
      showSupport={true}
    />
  )
}
```

#### D. Progress Indicator para Navegação (Prioridade: BAIXA)

```tsx
// components/features/NavigationProgress.tsx (NEW)
'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

export function NavigationProgress() {
  const pathname = usePathname()
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(true)
    setProgress(30)

    const timer1 = setTimeout(() => setProgress(60), 100)
    const timer2 = setTimeout(() => setProgress(100), 300)
    const timer3 = setTimeout(() => setVisible(false), 500)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
    }
  }, [pathname])

  if (!visible) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-zinc-900">
      <div
        className="h-full bg-gradient-to-r from-purple-600 to-pink-500 transition-all duration-300"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}
```

Adicionar em `app/v1/layout.tsx`:
```tsx
<NavigationProgress />
```

---

## 3. 📱 Responsividade Mobile

### Problemas Identificados (Análise Detalhada)

#### Issue #1: SearchBar muito largo em mobile
- **Arquivo:** `components/SearchBar.tsx:8`
- **Problema:** `className="w-64"` (256px) em telas mobile (~375px) deixa pouco espaço
- **Fix:**

```tsx
// components/SearchBar.tsx (MODIFY linha 8)
<input
  type="text"
  placeholder="Buscar artistas, produções..."
  className="w-48 md:w-64 px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-800 focus:border-purple-600 focus:outline-none transition-colors"
  //      ^^^^^ ADD: w-48 para mobile, w-64 para desktop
/>
```

#### Issue #2: News page sem breakpoints intermediários
- **Arquivo:** `app/v1/news/page.tsx:33`
- **Problema:** `grid-cols-1 lg:grid-cols-3` pula direto de 1 para 3 colunas
- **Fix:**

```tsx
// app/v1/news/page.tsx (MODIFY linha 33)
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
  {/*                          ^^^^^^^^^^^^^^^^^ ADD */}
  {news.map((item: any) => (/* ... */))}
</div>
```

#### Issue #3: Hero section desproporcional em mobile
- **Arquivo:** `app/v1/page.tsx:16`
- **Problema:** `h-[85vh]` muito alto em smartphones (tela pequena)
- **Fix:**

```tsx
// app/v1/page.tsx (MODIFY linha 16)
<section className="relative h-[60vh] sm:h-[70vh] md:h-[85vh] w-full flex items-end pb-24 px-4 sm:px-12 md:px-20 overflow-hidden">
  {/*                        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ ADD breakpoints */}
```

#### Issue #4: Fontes muito pequenas (text-[10px])
- **Arquivos:** `app/v1/page.tsx:29,91`, `app/v1/artists/page.tsx`, etc.
- **Problema:** 10px ilegível em mobile, acessibilidade comprometida
- **Fix:**

```tsx
// app/v1/page.tsx (MODIFY linha 29)
<span className="inline-block px-3 py-1 bg-purple-600 text-xs font-black uppercase tracking-widest rounded-sm mb-4">
  {/*                                                   ^^^^^^^ CHANGE: text-[10px] → text-xs (12px) */}
  Versão 1.0 Oficial
</span>

// app/v1/page.tsx (MODIFY linhas 91-92)
<span className="text-xs sm:text-sm px-2 py-1 bg-white text-black font-bold rounded-sm">{prod.type}</span>
<span className="text-xs sm:text-sm px-2 py-1 bg-zinc-800 text-white font-bold rounded-sm">{prod.year}</span>
```

#### Issue #5: Productions page com altura fixa em tablets
- **Arquivo:** `app/v1/productions/page.tsx`
- **Problema:** `h-56` ou `h-80` não adapta para tablets
- **Fix:**

```tsx
// app/v1/productions/page.tsx (MODIFY)
<div className="h-56 md:h-64 lg:h-80 rounded-lg overflow-hidden bg-zinc-900 relative shadow-xl group border border-white/5">
  {/*         ^^^^^^^^^^^^^^^^ ADD breakpoints */}
```

#### Issue #6: Padding horizontal inconsistente
- **Problema:** Algumas páginas usam `px-4`, outras `px-8`
- **Fix (padrão global):**

```tsx
// Padrão recomendado para todas as páginas:
<div className="px-4 sm:px-8 md:px-12 lg:px-20">
  {/* Conteúdo */}
</div>
```

### Plano de Implementação Mobile

**Fase 1 - Fixes Críticos (1 dia):**
1. ✅ SearchBar width (Issue #1)
2. ✅ Hero section height (Issue #3)
3. ✅ Font sizes (Issue #4)

**Fase 2 - Layout (1 dia):**
1. ✅ News grid breakpoints (Issue #2)
2. ✅ Productions height (Issue #5)
3. ✅ Padding consistency (Issue #6)

**Fase 3 - Testes (1 dia):**
- Testar em iPhone SE (375px)
- Testar em iPad (768px)
- Testar em desktop (1920px)
- Validar acessibilidade (contraste, tamanhos)

---

## 4. ⭐ Artistas em Destaque

### Estado Atual

- **Arquivo:** `app/v1/page.tsx:57-74`
- Exibe 6 artistas da tabela (sem critério específico)
- Grid responsivo: `grid-cols-2 sm:grid-cols-3 lg:grid-cols-6`
- Hover mostra nome do artista
- Link para página de artistas (não para perfil individual)

### Problemas Identificados

1. **Sem critério de "destaque"**
   - Apenas `take: 6` sem orderBy
   - Não reflete popularidade ou relevância

2. **Link incorreto**
   - Vai para `/v1/artists` (listagem) ao invés de `/v1/artists/[id]` (perfil)

3. **Pouca informação no hover**
   - Apenas nome, sem agência ou tipo

4. **Grid estático**
   - Não usa carousel em mobile (scroll horizontal seria melhor)

### Solução Proposta

#### A. Sistema de Trending Score (Prioridade: ALTA)

**Adicionar campo no schema:**

```prisma
// prisma/schema.prisma (MODIFY)

model Artist {
  // ... existing fields

  // NEW: Trending metrics
  viewCount      Int      @default(0)
  favoriteCount  Int      @default(0)
  lastTrendingUpdate DateTime?
  trendingScore  Float    @default(0.0)  // Calculado periodicamente

  @@index([trendingScore])
}
```

**Algoritmo de trending:**

```typescript
// lib/services/trending-service.ts (NEW)

interface TrendingFactors {
  viewCount: number        // Peso: 0.3
  favoriteCount: number    // Peso: 0.4
  recentActivity: number   // Peso: 0.2 (novos na última semana)
  completeness: number     // Peso: 0.1 (tem bio, imagem, filmografia)
}

export class TrendingService {
  async calculateTrendingScore(artistId: string): Promise<number> {
    const artist = await prisma.artist.findUnique({
      where: { id: artistId },
      include: {
        _count: {
          select: { favorites: true, productions: true }
        }
      }
    })

    if (!artist) return 0

    // Normalize factors (0-1 scale)
    const maxViews = 10000
    const maxFavorites = 1000

    const viewScore = Math.min(artist.viewCount / maxViews, 1) * 0.3
    const favoriteScore = Math.min(artist._count.favorites / maxFavorites, 1) * 0.4

    // Recent activity (created in last 7 days)
    const daysSinceCreated = (Date.now() - artist.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    const recentScore = daysSinceCreated < 7 ? (1 - daysSinceCreated / 7) * 0.2 : 0

    // Completeness (has bio, image, filmography)
    const hasBio = !!artist.bioPt
    const hasImage = !!artist.primaryImageUrl
    const hasFilmography = artist._count.productions > 0
    const completenessScore = ((hasBio ? 1 : 0) + (hasImage ? 1 : 0) + (hasFilmography ? 1 : 0)) / 3 * 0.1

    return viewScore + favoriteScore + recentScore + completenessScore
  }

  async updateAllTrendingScores(): Promise<void> {
    const artists = await prisma.artist.findMany({ select: { id: true } })

    for (const artist of artists) {
      const score = await this.calculateTrendingScore(artist.id)
      await prisma.artist.update({
        where: { id: artist.id },
        data: {
          trendingScore: score,
          lastTrendingUpdate: new Date()
        }
      })
    }
  }

  async getTrendingArtists(limit: number = 6) {
    return await prisma.artist.findMany({
      take: limit,
      orderBy: { trendingScore: 'desc' },
      include: {
        agency: { select: { name: true } },
        _count: { select: { favorites: true, productions: true } }
      }
    })
  }
}
```

**Integrar no cron:**

```typescript
// scripts/atualize-ai.ts (MODIFY)

import { TrendingService } from '@/lib/services/trending-service'

// Add after filmography refresh
if (options.updateTrending !== false) {
  console.log('\n\n📈 ATUALIZANDO TRENDING SCORES\n')
  const trendingService = new TrendingService()
  await trendingService.updateAllTrendingScores()
  console.log('✅ Trending scores atualizados')
}
```

**Atualizar homepage:**

```typescript
// app/v1/page.tsx (MODIFY linha 8)
const trendingArtists = await prisma.artist.findMany({
  take: 6,
  orderBy: { trendingScore: 'desc' },  // ADD
  include: {
    agency: { select: { name: true } }  // ADD
  }
})
```

#### B. Enhanced Artist Cards (Prioridade: MÉDIA)

```tsx
// app/v1/page.tsx (MODIFY linhas 64-71)
{trendingArtists.map((artist: any) => (
  <Link
    key={artist.id}
    href={`/v1/artists/${artist.id}`}  // FIX: link para perfil individual
    className="card-hover group"
  >
    <div className="aspect-[3/4] rounded-lg overflow-hidden bg-zinc-900 shadow-lg border border-white/5 relative">
      <img
        src={artist.primaryImageUrl || "https://placeholder.com/600"}
        alt={artist.nameRomanized}
        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
      />

      {/* Enhanced overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4 gap-1">
        <span className="text-lg font-bold">{artist.nameRomanized}</span>
        {artist.agency && (
          <span className="text-xs text-zinc-400">{artist.agency.name}</span>
        )}
        {artist.type && (
          <span className="text-[10px] px-2 py-1 bg-purple-600 rounded-full w-fit">
            {artist.type}
          </span>
        )}
      </div>

      {/* Trending badge */}
      {artist.trendingScore > 0.7 && (
        <div className="absolute top-2 right-2 bg-gradient-to-r from-purple-600 to-pink-500 px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1">
          🔥 TRENDING
        </div>
      )}
    </div>
  </Link>
))}
```

#### C. Mobile Carousel (Prioridade: BAIXA)

```tsx
// components/features/ArtistCarousel.tsx (NEW)
'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export function ArtistCarousel({ artists }: { artists: any[] }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  // Auto-advance every 5 seconds
  useEffect(() => {
    if (!isAutoPlaying) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % artists.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [isAutoPlaying, artists.length])

  const goToPrevious = () => {
    setIsAutoPlaying(false)
    setCurrentIndex((prev) => (prev - 1 + artists.length) % artists.length)
  }

  const goToNext = () => {
    setIsAutoPlaying(false)
    setCurrentIndex((prev) => (prev + 1) % artists.length)
  }

  return (
    <div className="relative">
      {/* Mobile: Carousel */}
      <div className="lg:hidden">
        <div className="relative aspect-[3/4] rounded-lg overflow-hidden">
          <img
            src={artists[currentIndex].primaryImageUrl || "https://placeholder.com/600"}
            alt={artists[currentIndex].nameRomanized}
            className="w-full h-full object-cover"
          />

          {/* Controls */}
          <button
            onClick={goToPrevious}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 p-2 rounded-full"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 p-2 rounded-full"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Indicators */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {artists.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setIsAutoPlaying(false)
                  setCurrentIndex(idx)
                }}
                className={`w-2 h-2 rounded-full transition-all ${
                  idx === currentIndex
                    ? 'bg-purple-600 w-6'
                    : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Artist info below */}
        <div className="mt-4 text-center">
          <h3 className="text-xl font-bold">{artists[currentIndex].nameRomanized}</h3>
          {artists[currentIndex].agency && (
            <p className="text-sm text-zinc-400">{artists[currentIndex].agency.name}</p>
          )}
        </div>
      </div>

      {/* Desktop: Grid (keep existing) */}
      <div className="hidden lg:grid grid-cols-6 gap-4">
        {/* Existing grid code */}
      </div>
    </div>
  )
}
```

**Uso na homepage:**

```tsx
// app/v1/page.tsx (MODIFY linha 62)
import { ArtistCarousel } from '@/components/features/ArtistCarousel'

<section>
  <h2 className="text-xl md:text-2xl font-bold mb-6 text-zinc-100 flex items-center justify-between">
    Artistas em Destaque
    <Link href="/v1/artists" className="text-xs text-purple-500 hover:text-white transition-colors">Ver todos →</Link>
  </h2>

  <ArtistCarousel artists={trendingArtists} />
</section>
```

#### D. View Tracking (Prioridade: MÉDIA)

```typescript
// app/api/artists/[id]/view/route.ts (NEW)

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.artist.update({
      where: { id: params.id },
      data: { viewCount: { increment: 1 } }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to track view' }, { status: 500 })
  }
}
```

**Uso no perfil do artista:**

```tsx
// app/v1/artists/[id]/page.tsx (ADD)
'use client'

import { useEffect } from 'react'

export default function ArtistProfilePage({ params }: { params: { id: string } }) {
  useEffect(() => {
    // Track view (fire and forget)
    fetch(`/api/artists/${params.id}/view`, { method: 'POST' }).catch(() => {})
  }, [params.id])

  return (/* ... */)
}
```

---

## 📊 Resumo de Prioridades

### Implementar Primeiro (Semana 1)

| Feature | Área | Complexidade | Impacto |
|---------|------|--------------|---------|
| Toast Notifications | Notificações | Baixa | Alto |
| Button Loading States | UI Experience | Baixa | Alto |
| Skeleton Screens | UI Experience | Média | Alto |
| Mobile Font Fixes | Responsividade | Baixa | Alto |
| SearchBar Width Fix | Responsividade | Baixa | Médio |
| Hero Height Fix | Responsividade | Baixa | Médio |
| Trending Score System | Artistas | Média | Alto |
| Fix Artist Links | Artistas | Baixa | Alto |

### Implementar Depois (Semana 2+)

| Feature | Área | Complexidade | Impacto |
|---------|------|--------------|---------|
| Slack Enhancements | Notificações | Média | Médio |
| Error Messages | UI Experience | Baixa | Médio |
| Navigation Progress | UI Experience | Baixa | Baixo |
| News Grid Breakpoints | Responsividade | Baixa | Médio |
| Productions Height | Responsividade | Baixa | Médio |
| Enhanced Artist Cards | Artistas | Média | Médio |
| View Tracking | Artistas | Média | Médio |
| Mobile Carousel | Artistas | Alta | Médio |
| Persistent Notifications | Notificações | Alta | Baixo |

---

## 🚀 Estratégia de Deploy

### Validação Local (OBRIGATÓRIO)

```bash
# Antes de cada commit
npm run typecheck
npm run lint

# Antes de push
npm run validate  # typecheck + lint + build
```

### Branches

```bash
# 1. Implementar em branch de feature
git checkout -b feature/melhorias-ui

# 2. Commit incremental
git add .
git commit -m "feat: add toast notifications system"

# 3. Push para develop
git push origin feature/melhorias-ui

# 4. Testar em staging (http://31.97.255.107:3001)

# 5. Merge para main após validação
git checkout main
git merge feature/melhorias-ui
git push origin main
```

### Testes Requeridos

- [ ] TypeScript compile sem erros
- [ ] ESLint sem warnings críticos
- [ ] Build bem-sucedido
- [ ] Teste manual em mobile (iPhone SE, iPad)
- [ ] Teste manual em desktop (Chrome, Safari)
- [ ] Verificar notificações Slack funcionando
- [ ] Confirmar trending scores calculando corretamente

---

## 📝 Checklist de Implementação

### Notificações
- [ ] Criar `useToast` hook
- [ ] Criar `ToastContainer` component
- [ ] Adicionar em `app/v1/layout.tsx`
- [ ] Integrar em ações de usuário (login, favoritar, admin)
- [ ] Melhorar Slack notifications com user info e links
- [ ] (Opcional) Sistema de notificações persistentes

### UI Experience
- [ ] Criar `Button` component com loading state
- [ ] Criar skeletons (ArtistCard, ProductionCard, NewsCard)
- [ ] Adicionar Suspense boundaries com skeletons
- [ ] Criar `ErrorMessage` component
- [ ] Usar ErrorMessage em páginas de erro
- [ ] (Opcional) Navigation progress bar

### Responsividade
- [ ] Fix SearchBar width (w-48 md:w-64)
- [ ] Fix Hero height (h-[60vh] sm:h-[70vh] md:h-[85vh])
- [ ] Fix font sizes (text-xs ao invés de text-[10px])
- [ ] Fix News grid (add md:grid-cols-2)
- [ ] Fix Productions height (add breakpoints)
- [ ] Padronizar padding horizontal (px-4 sm:px-8 md:px-12 lg:px-20)
- [ ] Testar em iPhone SE, iPad, Desktop

### Artistas em Destaque
- [ ] Adicionar campos de trending ao schema
- [ ] Criar migration
- [ ] Criar `TrendingService`
- [ ] Integrar no cron (`scripts/atualize-ai.ts`)
- [ ] Atualizar query da homepage (orderBy trendingScore)
- [ ] Fix link para perfil individual (/v1/artists/${id})
- [ ] Enhanced artist cards (agency, type, badges)
- [ ] Criar API de view tracking
- [ ] Integrar view tracking no perfil
- [ ] (Opcional) Mobile carousel

---

## 🎯 Métricas de Sucesso

Após implementação, validar:

1. **Notificações:**
   - ✅ Toast aparece em todas as ações de usuário
   - ✅ Slack notifications incluem user info e links
   - ✅ Usuário recebe feedback visual em <500ms

2. **UI Experience:**
   - ✅ Botões mostram loading state durante operações
   - ✅ Páginas mostram skeleton screens enquanto carregam
   - ✅ Erros mostram mensagens úteis com ações de recuperação
   - ✅ Transições suaves entre páginas

3. **Responsividade:**
   - ✅ Site funcional em iPhone SE (375px)
   - ✅ Layout adapta corretamente em iPad (768px)
   - ✅ Fontes legíveis em todos os dispositivos (mínimo 12px)
   - ✅ Sem scroll horizontal indesejado

4. **Artistas em Destaque:**
   - ✅ Trending scores calculados corretamente
   - ✅ Artistas relevantes aparecem em destaque
   - ✅ Links levam para perfil individual
   - ✅ View tracking funcionando
   - ✅ Cards mostram informações úteis (agência, tipo)

---

## 📞 Próximos Passos

1. **Revisar proposta com equipe**
   - Validar prioridades
   - Ajustar timeline se necessário
   - Definir responsáveis

2. **Criar issues no GitHub**
   - Uma issue por feature
   - Usar labels: enhancement, ui, mobile, notifications

3. **Começar implementação**
   - Seguir ordem de prioridades
   - Commits frequentes e incrementais
   - Testar constantemente em staging

4. **Documentar mudanças**
   - Atualizar README com novas features
   - Documentar novos componentes
   - Adicionar exemplos de uso

---

**Última atualização:** 2026-02-04
**Status:** Proposta para aprovação
