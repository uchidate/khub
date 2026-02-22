/**
 * Script: Sincroniza perfis de idols do kpopping.com via JSON API
 *
 * Uso:
 *   npx tsx scripts/kpopping-sync.ts                # Sync completo (~9000 idols)
 *   npx tsx scripts/kpopping-sync.ts --dry-run      # Simula sem salvar
 *   npx tsx scripts/kpopping-sync.ts --limit=50     # Limita a N idols
 *   npx tsx scripts/kpopping-sync.ts --slug=Jisoo   # Inspeciona um idol específico
 *
 * Banco separado:
 *   Requer KPOPPING_DATABASE_URL no .env
 *   Ex: postgresql://hallyuhub:pass@postgres-production:5432/kpopping_db
 */

import 'dotenv/config'
import { PrismaClient } from '../node_modules/.prisma/kpopping-client'
import { PrismaPg } from '@prisma/adapter-pg'

// ============================================================================
// Config
// ============================================================================
const KPOPPING_API = 'https://kpopping.com/api'
const DELAY_MS = 300 // API é mais rápida que HTML scraping

const args = process.argv.slice(2)
const isDryRun = args.includes('--dry-run')
const limitArg = args.find(a => a.startsWith('--limit='))?.split('=')[1]
const slugArg = args.find(a => a.startsWith('--slug='))?.split('=')[1]
const LIMIT = limitArg ? parseInt(limitArg) : Infinity

// ============================================================================
// DB (banco separado)
// ============================================================================
const dbUrl = process.env.KPOPPING_DATABASE_URL
if (!isDryRun && !slugArg && !dbUrl) {
  console.error('❌ KPOPPING_DATABASE_URL não configurada no .env')
  process.exit(1)
}
const adapter = dbUrl ? new PrismaPg({ connectionString: dbUrl }) : null
const db = adapter ? new PrismaClient({ adapter }) : null as any

// ============================================================================
// HTTP
// ============================================================================
const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept: 'application/json',
  'Accept-Language': 'en-US,en;q=0.9',
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { headers: HEADERS })
    if (res.status === 429) {
      console.warn('  Rate limit! Aguardando 15s...')
      await sleep(15000)
      return fetchJson(url)
    }
    if (!res.ok) {
      console.warn(`  HTTP ${res.status} para ${url}`)
      return null
    }
    return res.json() as Promise<T>
  } catch (err: any) {
    console.warn(`  Erro: ${err.message}`)
    return null
  }
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ============================================================================
// API Types
// ============================================================================
interface IdolListItem {
  id: string
  slug: string
  stageName: string
  fullName: string | null
  image: string | null
  birthdate: string | null
  gender: string | null
  country: string | null
  status: string | null
  groupName: string | null
}

interface IdolDetail extends IdolListItem {
  nativeName: string | null
  debutDate: string | null
  hometown: string | null
  height: number | null
  weight: number | null
  bloodType: string | null
  mbti: string | null
  education: string | null
  fandomName: string | null
  fandomColors: string | null // JSON string: "[{\"hex\":\"#000000\",\"name\":\"Black\"}]"
  bioRaw: string | null
}

// ============================================================================
// Helpers
// ============================================================================
function parseDate(raw: string | null | undefined): Date | null {
  if (!raw) return null
  const d = new Date(raw)
  return isNaN(d.getTime()) ? null : d
}

function parseFandomColors(raw: string | null): object | null {
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

// ============================================================================
// API Calls
// ============================================================================
async function fetchAllIdols(): Promise<IdolListItem[]> {
  console.log('📋 Buscando lista completa de idols via API...')
  const data = await fetchJson<IdolListItem[]>(`${KPOPPING_API}/idols`)
  if (!data || !Array.isArray(data)) {
    console.error('❌ Resposta inesperada de /api/idols')
    return []
  }
  console.log(`   ${data.length} idols encontrados`)
  return data
}

async function fetchIdolDetail(slug: string): Promise<IdolDetail | null> {
  return fetchJson<IdolDetail>(`${KPOPPING_API}/idols/${encodeURIComponent(slug)}`)
}

// ============================================================================
// Sync idol
// ============================================================================
async function syncIdol(slug: string, listItem?: IdolListItem): Promise<boolean> {
  const detail = await fetchIdolDetail(slug)
  if (!detail && !listItem) return false

  const data = {
    slug,
    nameRomanized: detail?.stageName || listItem?.stageName || slug,
    nameHangul: detail?.nativeName || null,
    fullName: detail?.fullName || listItem?.fullName || null,
    birthday: parseDate(detail?.birthdate || listItem?.birthdate),
    height: detail?.height ?? null,
    weight: detail?.weight ?? null,
    bloodType: detail?.bloodType || null,
    mbti: detail?.mbti || null,
    debutDate: parseDate(detail?.debutDate),
    education: detail?.education || null,
    hometown: detail?.hometown || null,
    country: detail?.country || listItem?.country || null,
    gender: detail?.gender || listItem?.gender || null,
    status: detail?.status || listItem?.status || null,
    fandomName: detail?.fandomName || null,
    fandomColors: parseFandomColors(detail?.fandomColors ?? null),
    bio: detail?.bioRaw || null,
    imageUrl: detail?.image || listItem?.image || null,
    profileUrl: `https://kpopping.com/profiles/idol/${slug}`,
  }

  console.log(
    `  ✅ ${data.nameRomanized}${data.nameHangul ? ' (' + data.nameHangul + ')' : ''}` +
    `${data.mbti ? ' · ' + data.mbti : ''}` +
    `${data.height ? ' · ' + data.height + 'cm' : ''}`
  )

  if (!isDryRun && db) {
    await db.idol.upsert({
      where: { slug },
      update: { ...data, updatedAt: new Date() },
      create: data,
    })
  }

  return true
}

// ============================================================================
// Main
// ============================================================================
async function main() {
  console.log('🎤 Kpopping Sync (JSON API)')
  console.log(`   Dry run: ${isDryRun}`)
  if (LIMIT !== Infinity) console.log(`   Limite:  ${LIMIT}`)
  if (slugArg) console.log(`   Slug:    ${slugArg}`)

  // Modo single (inspecionar um idol)
  if (slugArg) {
    const detail = await fetchIdolDetail(slugArg)
    if (detail) {
      console.log('\nDados da API:')
      console.log(JSON.stringify(detail, null, 2))
    } else {
      console.log(`❌ Idol "${slugArg}" não encontrado`)
    }
    await db?.$disconnect()
    return
  }

  // Fetch lista completa
  const allIdols = await fetchAllIdols()
  if (allIdols.length === 0) {
    console.error('❌ Nenhum idol encontrado. Abortando.')
    process.exit(1)
  }

  const toSync = allIdols.slice(0, LIMIT === Infinity ? allIdols.length : LIMIT)

  let done = 0, fail = 0
  for (let i = 0; i < toSync.length; i++) {
    const item = toSync[i]
    process.stdout.write(`[${i + 1}/${toSync.length}] ${item.slug} `)
    const ok = await syncIdol(item.slug, item)
    ok ? done++ : fail++
    if (i < toSync.length - 1) await sleep(DELAY_MS)
  }

  console.log(`\n✅ Concluído!`)
  console.log(`   Idols: ${done} sincronizados | ${fail} falhos`)
  if (isDryRun) console.log('\n   ⚠️  Dry run — nenhuma alteração salva')

  await db?.$disconnect()
}

main().catch(async err => {
  console.error('❌ Erro:', err)
  await db?.$disconnect()
  process.exit(1)
})
