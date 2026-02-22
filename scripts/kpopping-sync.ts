/**
 * Script: Sincroniza perfis de idols do kpopping.com para banco separado
 *
 * Uso:
 *   npx prisma generate --schema=prisma-kpopping/schema.prisma   # gerar client
 *   npx prisma migrate deploy --schema=prisma-kpopping/schema.prisma  # criar tabelas
 *
 *   npx tsx scripts/kpopping-sync.ts                # Sync completo
 *   npx tsx scripts/kpopping-sync.ts --dry-run      # Simula sem salvar
 *   npx tsx scripts/kpopping-sync.ts --limit=50     # Limita a N idols
 *   npx tsx scripts/kpopping-sync.ts --slug=Jisoo   # Sincroniza um idol específico
 *   npx tsx scripts/kpopping-sync.ts --groups        # Sincroniza grupos também
 */

import 'dotenv/config'
import { PrismaClient } from '../node_modules/.prisma/kpopping-client'
import { PrismaPg } from '@prisma/adapter-pg'

// ============================================================================
// Config
// ============================================================================
const KPOPPING_BASE = 'https://kpopping.com'
const CDN_BASE = 'https://cdn.kpopping.com'
const DELAY_MS = 1500 // respeitar servidor (>= 3s crawl-delay do robots.txt dividido por 2 reqs)

const args = process.argv.slice(2)
const isDryRun = args.includes('--dry-run')
const withGroups = args.includes('--groups')
const limitArg = args.find(a => a.startsWith('--limit='))?.split('=')[1]
const slugArg = args.find(a => a.startsWith('--slug='))?.split('=')[1]
const LIMIT = limitArg ? parseInt(limitArg) : Infinity

// ============================================================================
// DB (banco separado)
// ============================================================================
// DB só necessário quando não é dry-run
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
const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  Connection: 'keep-alive',
  'Upgrade-Insecure-Requests': '1',
}

async function fetchPage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { headers: BROWSER_HEADERS })
    if (res.status === 429) {
      console.warn('  Rate limit! Aguardando 10s...')
      await sleep(10000)
      return fetchPage(url)
    }
    if (!res.ok) {
      console.warn(`  HTTP ${res.status} para ${url}`)
      return null
    }
    return res.text()
  } catch (err: any) {
    console.warn(`  Erro ao buscar ${url}: ${err.message}`)
    return null
  }
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ============================================================================
// Parsers
// ============================================================================
function extractField(html: string, label: string): string | null {
  // Padrão: {Label}</p><p ...>VALUE</p>
  const re = new RegExp(
    label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '<\\/p>\\s*<p[^>]*>([^<]+)<\\/p>',
    'i'
  )
  const m = html.match(re)
  return m ? m[1].trim() : null
}

function extractHangul(html: string): string | null {
  const hangulRe = /[\uAC00-\uD7AF]{2,}/g
  const all = [...html.matchAll(hangulRe)].map(m => m[0])
  // Retorna o primeiro nome em Hangul (tipicamente o nome do artista)
  return all.length > 0 ? all[0] : null
}

function extractProfileImage(slug: string): string {
  return `${CDN_BASE}/idols/${slug}/profile.jpg`
}

function parseDate(raw: string | null): Date | null {
  if (!raw) return null
  // Formatos: "1995-01-03 (Age 31)" ou "2016-08-08"
  const match = raw.match(/(\d{4}-\d{2}-\d{2})/)
  if (!match) return null
  const d = new Date(match[1])
  return isNaN(d.getTime()) ? null : d
}

function parseIdolProfile(html: string, slug: string) {
  const rawData: Record<string, string> = {}

  // Extrair todos os pares label/value
  const allPairs = [...html.matchAll(/<p[^>]*>([A-Za-z ]{2,40})<\/p>\s*<p[^>]*>([^<]{1,150})<\/p>/g)]
  allPairs.forEach(m => {
    const label = m[1].trim()
    const value = m[2].trim()
    if (label && value) rawData[label] = value
  })

  const birthdayRaw = rawData['Birthday'] || null
  const debutRaw = rawData['Debut'] || null

  // Extrair grupo a partir de href
  const groupMatch = html.match(/href="\/profiles\/group\/([^"]+)"/)
  const groupSlug = groupMatch ? decodeURIComponent(groupMatch[1]) : null

  return {
    slug,
    nameRomanized: slug.replace(/-?\d+$/, '').replace(/-/g, ' ').trim(),
    nameHangul: extractHangul(html),
    fullName: rawData['Full name'] || rawData['Real name'] || null,
    birthday: parseDate(birthdayRaw),
    height: rawData['Height'] || null,
    weight: rawData['Weight'] || null,
    bloodType: rawData['Blood Type'] || rawData['Blood type'] || null,
    zodiacSign: rawData['Zodiac'] || rawData['Zodiac Sign'] || null,
    mbti: rawData['MBTI'] || null,
    debutDate: parseDate(debutRaw),
    education: rawData['Education'] || null,
    hometown: rawData['Hometown'] || null,
    country: rawData['Country'] || rawData['Nationality'] || null,
    fandom: rawData['Fandom'] || null,
    imageUrl: extractProfileImage(slug),
    profileUrl: `${KPOPPING_BASE}/profiles/idol/${slug}`,
    rawData: rawData as any,
    groupSlug,
  }
}

function parseGroupProfile(html: string, slug: string) {
  const rawData: Record<string, string> = {}
  const allPairs = [...html.matchAll(/<p[^>]*>([A-Za-z ]{2,40})<\/p>\s*<p[^>]*>([^<]{1,150})<\/p>/g)]
  allPairs.forEach(m => {
    const label = m[1].trim()
    const value = m[2].trim()
    if (label && value) rawData[label] = value
  })

  // Cores do fandom (múltiplas)
  const colorMatches = [...html.matchAll(/#([0-9a-fA-F]{6})\b/g)]
  const fandomColors = [...new Set(colorMatches.map(m => '#' + m[1]))]

  return {
    slug,
    name: slug.replace(/-/g, ' '),
    nameHangul: extractHangul(html),
    debutDate: parseDate(rawData['Debut'] || null),
    agency: rawData['Agency'] || rawData['Label'] || null,
    fandomName: rawData['Fandom'] || null,
    fandomColors,
    imageUrl: `${CDN_BASE}/groups/${slug}/profile.jpg`,
    rawData: rawData as any,
  }
}

// ============================================================================
// Fetch all idol slugs
// ============================================================================
async function fetchAllIdolSlugs(): Promise<string[]> {
  console.log('📋 Buscando lista de idols...')
  const html = await fetchPage(`${KPOPPING_BASE}/profiles/the-idols?page=2`)
  if (!html) return []

  const idolLinks = [...html.matchAll(/href="\/profiles\/idol\/([^"]+)"/g)]
  const slugs = [...new Set(idolLinks.map(m => m[1]))]
  console.log(`   ${slugs.length} idols encontrados`)
  return slugs
}

async function fetchAllGroupSlugs(): Promise<string[]> {
  console.log('📋 Buscando lista de grupos...')
  const html = await fetchPage(`${KPOPPING_BASE}/profiles/groups`)
  if (!html) return []

  const groupLinks = [...html.matchAll(/href="\/profiles\/group\/([^"]+)"/g)]
  const slugs = [...new Set(groupLinks.map(m => decodeURIComponent(m[1])))]
  console.log(`   ${slugs.length} grupos encontrados`)
  return slugs
}

// ============================================================================
// Sync idol
// ============================================================================
async function syncIdol(slug: string): Promise<boolean> {
  const url = `${KPOPPING_BASE}/profiles/idol/${slug}`
  const html = await fetchPage(url)
  if (!html) return false

  const profile = parseIdolProfile(html, slug)

  console.log(
    `  ✅ ${profile.nameRomanized}${profile.nameHangul ? ' (' + profile.nameHangul + ')' : ''}` +
    `${profile.mbti ? ' · ' + profile.mbti : ''}` +
    `${profile.height ? ' · ' + profile.height : ''}`
  )

  if (!isDryRun) {
    const { groupSlug, ...data } = profile
    await db.idol.upsert({
      where: { slug },
      update: { ...data, updatedAt: new Date() },
      create: data,
    })

    // Vincular ao grupo se existir
    if (groupSlug) {
      const group = await db.group.findUnique({ where: { slug: groupSlug } })
      if (group) {
        const idol = await db.idol.findUnique({ where: { slug } })
        if (idol) {
          await db.idolInGroup.upsert({
            where: { idolId_groupId: { idolId: idol.id, groupId: group.id } },
            update: {},
            create: { idolId: idol.id, groupId: group.id },
          })
        }
      }
    }
  }

  return true
}

// ============================================================================
// Sync group
// ============================================================================
async function syncGroup(slug: string): Promise<boolean> {
  const url = `${KPOPPING_BASE}/profiles/group/${encodeURIComponent(slug)}`
  const html = await fetchPage(url)
  if (!html) return false

  const profile = parseGroupProfile(html, slug)

  console.log(`  ✅ ${profile.name}${profile.nameHangul ? ' (' + profile.nameHangul + ')' : ''}`)

  if (!isDryRun) {
    await db.group.upsert({
      where: { slug },
      update: { ...profile, updatedAt: new Date() },
      create: profile,
    })
  }

  return true
}

// ============================================================================
// Main
// ============================================================================
async function main() {
  console.log('🎤 Kpopping Sync')
  console.log(`   Dry run: ${isDryRun}`)
  console.log(`   Grupos:  ${withGroups}`)
  if (LIMIT !== Infinity) console.log(`   Limite:  ${LIMIT}`)
  if (slugArg) console.log(`   Slug:    ${slugArg}`)

  // Modo single
  if (slugArg) {
    const html = await fetchPage(`${KPOPPING_BASE}/profiles/idol/${slugArg}`)
    if (html) {
      const profile = parseIdolProfile(html, slugArg)
      console.log('\nDados extraídos:')
      console.log(JSON.stringify(profile, null, 2))
    }
    await db?.$disconnect()
    return
  }

  // Sync grupos primeiro (para vincular idols depois)
  if (withGroups) {
    console.log('\n🎵 Sincronizando grupos...')
    const groupSlugs = await fetchAllGroupSlugs()
    let gDone = 0, gFail = 0
    for (const slug of groupSlugs.slice(0, LIMIT === Infinity ? groupSlugs.length : LIMIT)) {
      const ok = await syncGroup(slug)
      ok ? gDone++ : gFail++
      await sleep(DELAY_MS)
    }
    console.log(`   ✅ ${gDone} grupos sincronizados | ${gFail} falhos`)
  }

  // Sync idols
  console.log('\n🎤 Sincronizando idols...')
  const slugs = await fetchAllIdolSlugs()
  const toSync = slugs.slice(0, LIMIT === Infinity ? slugs.length : LIMIT)

  let done = 0, fail = 0
  for (let i = 0; i < toSync.length; i++) {
    const slug = toSync[i]
    process.stdout.write(`[${i + 1}/${toSync.length}] ${slug} `)
    const ok = await syncIdol(slug)
    ok ? done++ : fail++
    await sleep(DELAY_MS)
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
