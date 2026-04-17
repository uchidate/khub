import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import { revalidateTag, revalidatePath } from 'next/cache'

export const dynamic = 'force-dynamic'

const CACHE_TARGETS = {
  'system-settings': { tags: ['system-settings'], label: 'Configurações do sistema' },
  'productions': { paths: ['/productions', '/'], label: 'Produções' },
  'artists': { paths: ['/artists'], label: 'Artistas' },
  'news': { paths: ['/news'], label: 'Notícias' },
  'all': { label: 'Todo o cache' },
} as const

type CacheTarget = keyof typeof CACHE_TARGETS

/**
 * POST /api/admin/settings/revalidate
 * Body: { target: 'system-settings' | 'productions' | 'artists' | 'news' | 'all' }
 * Invalida o cache ISR do alvo especificado.
 */
export async function POST(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    const { target } = await req.json() as { target: CacheTarget }

    if (!target || !(target in CACHE_TARGETS)) {
      return NextResponse.json({ error: 'Target inválido' }, { status: 400 })
    }

    if (target === 'all') {
      revalidateTag('system-settings', { expire: 0 })
      revalidatePath('/productions')
      revalidatePath('/artists')
      revalidatePath('/news')
      revalidatePath('/')
    } else {
      const config = CACHE_TARGETS[target]
      if ('tags' in config) {
        for (const tag of config.tags) revalidateTag(tag, { expire: 0 })
      }
      if ('paths' in config) {
        for (const path of config.paths) revalidatePath(path)
      }
    }

    return NextResponse.json({ success: true, target, label: CACHE_TARGETS[target].label })
  } catch (err) {
    console.error('Revalidation error:', err)
    return NextResponse.json({ error: 'Falha ao revalidar cache' }, { status: 500 })
  }
}
